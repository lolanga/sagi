<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Importacion;
use App\Models\Unidad;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Carga masiva de items, fase de validacion.
 *
 * La validacion NO esta duplicada: cada fila se somete al alta real
 * (ItemController::store) dentro de una transaccion que siempre se revierte.
 * Asi la planilla se chequea con exactamente las mismas reglas que un alta
 * manual, y no puede quedarse desalineada si mañana cambian esas reglas.
 * No se escribe nada en esta fase.
 */
class ImportarController extends Controller
{
    /**
     * Columnas fijas del formato plano. Cualquier otra columna se interpreta
     * como campo dinamico del elemento de esa fila.
     * Las claves van ya normalizadas (sin tildes, minusculas, sin guiones).
     */
    private const COLUMNAS_FIJAS = [
        'categoria' => 'categoria',
        'codigo categoria' => 'categoria',
        'elemento' => 'elemento',
        'tipo item' => 'elemento',
        'cantidad' => 'cantidad',
        'cant num' => 'cantidad',
        'estado conservacion' => 'estado_conservacion',
        'estado' => 'estado_conservacion',
        'fecha alta' => 'fecha_alta',
    ];

    /** Valores admitidos de estado_conservacion, en minusculas. */
    private const ESTADOS = [
        'muy bueno' => 'Muy bueno',
        'bueno' => 'Bueno',
        'regular' => 'Regular',
        'malo' => 'Malo',
    ];

    private const MAXIMO_FILAS = 5000;

    /** Tope de filas por request de ejecucion: un lote por request. */
    private const MAXIMO_FILAS_EJECUCION = 1000;

    public function __construct(private readonly ItemController $items)
    {
    }

    /**
     * Columnas que espera el formato plano, mas el catalogo por categoria
     * (elementos y campos), para armar la plantilla de carga.
     */
    public function plantilla(): JsonResponse
    {
        $categorias = Categoria::where('es_transitoria', false)
            ->orderBy('codigo')
            ->with(['tiposItems' => fn ($q) => $q->orderBy('orden')])
            ->get();

        $salida = $categorias->map(function (Categoria $categoria) {
            $porNombre = $categoria->camposDinamicos()
                ->where('activo', true)
                ->get()
                ->groupBy(fn ($campo) => $this->normalizar($campo->nombre));

            $campos = $porNombre
                ->map(fn ($grupo) => [
                    'nombre' => $grupo->first()->nombre,
                    'tipo' => $grupo->first()->tipo,
                    // Obligatorio si lo es en al menos un elemento: en la
                    // planilla conviene prevenir antes que descubrirlo despues.
                    'requerido' => $grupo->contains('requerido', true),
                    'opciones' => $this->opcionesPlanas($grupo->first()->opciones),
                ])
                ->sortBy(fn ($campo, $clave) => $porNombre[$clave]->min('orden'))
                ->values();

            return [
                'codigo' => $categoria->codigo,
                'nombre' => $categoria->nombre,
                'requiere_elemento' => $categoria->tiposItems->isNotEmpty(),
                'elementos' => $categoria->tiposItems->pluck('nombre')->values(),
                'campos' => $campos,
            ];
        });

        return response()->json([
            'columnas_fijas' => ['categoria', 'elemento', 'cantidad', 'estado_conservacion', 'fecha_alta'],
            'columnas_de_contexto' => ['unidad_id', 'motivo_alta'],
            'categorias' => $salida,
        ]);
    }

    /**
     * Recorre las filas del archivo y devuelve qué fila tiene qué error.
     * No persiste nada: cada fila se prueba en una transaccion que se revierte.
     */
    public function validar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'unidad_id' => ['required', 'integer', Rule::exists('unidades', 'id')],
            'motivo_alta' => ['required', 'string', 'max:500'],
            'fecha_alta' => ['nullable', 'date', 'before_or_equal:today'],
            'headers' => ['required', 'array', 'min:1'],
            'filas' => ['required', 'array', 'min:1', 'max:'.self::MAXIMO_FILAS],
        ]);

        $encabezados = array_map(fn ($h) => (string) $h, $datos['headers']);

        if ($this->indiceColumna('categoria', $encabezados) === null) {
            return response()->json([
                'message' => "Falta la columna 'categoria'",
                'errors' => ['headers' => ["Falta la columna 'categoria'"]],
            ], 422);
        }

        $todasLasCategorias = Categoria::with('tiposItems')->orderBy('codigo')->get();
        $carga = Unidad::findOrFail($datos['unidad_id']);

        $normalizados = array_map(fn ($h) => $this->normalizar($h), $encabezados);

        $errores = [];
        $filasConError = 0;
        $ignoradas = [];

        foreach ($datos['filas'] as $indice => $fila) {
            // Fila 1 = primera fila bajo el encabezado.
            $nroFila = $indice + 1;
            $valoresFila = self::mapearFila($normalizados, is_array($fila) ? $fila : []);

            $fallos = $this->probarFila($request, $datos, $todasLasCategorias, $carga, $valoresFila, $normalizados, $encabezados, $ignoradas, $nroFila);

            if ($fallos === []) {
                continue;
            }

            $filasConError++;
            foreach ($fallos as $campo => $mensajes) {
                foreach ((array) $mensajes as $mensaje) {
                    $errores[] = ['fila' => $nroFila, 'campo' => $campo, 'mensaje' => (string) $mensaje];
                }
            }
        }

        return response()->json([
            'total' => count($datos['filas']),
            'validas' => count($datos['filas']) - $filasConError,
            'con_errores' => $filasConError,
            'errores' => $errores,
            'columnas_ignoradas' => collect($ignoradas)
            ->map(fn ($filas, $columna) => ['columna' => $columna, 'filas' => array_values($filas)])
            ->values(),
        ]);
    }

    /**
     * Carga de verdad. Mismo formato que la validacion, mas import_uuid y
     * lote: con esos dos numeros el lote es idempotente. Si el mismo lote
     * vuelve a llegar (reintento de red, doble clic) se devuelve el resultado
     * guardado y no se inserta una sola fila.
     */
    public function ejecutar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'unidad_id' => ['required', 'integer', Rule::exists('unidades', 'id')],
            'motivo_alta' => ['required', 'string', 'max:500'],
            'fecha_alta' => ['nullable', 'date', 'before_or_equal:today'],
            'import_uuid' => ['required', 'uuid'],
            'lote' => ['required', 'integer', 'min:1'],
            'headers' => ['required', 'array', 'min:1'],
            'filas' => ['required', 'array', 'min:1', 'max:'.self::MAXIMO_FILAS_EJECUCION],
        ]);

        $encabezados = array_map(fn ($h) => (string) $h, $datos['headers']);

        if ($this->indiceColumna('categoria', $encabezados) === null) {
            return response()->json([
                'message' => "Falta la columna 'categoria'",
                'errors' => ['headers' => ["Falta la columna 'categoria'"]],
            ], 422);
        }

        // Se reserva el lote ANTES de insertar: si el request se corta a
        // mitad, queda marcado como interrumpido y un reintento no puede
        // duplicar lo que ya se cargo.
        $registro = $this->reservarLote($datos, $request->user());

        if ($registro instanceof JsonResponse) {
            return $registro;
        }

        $todasLasCategorias = Categoria::with('tiposItems')->orderBy('codigo')->get();
        $carga = Unidad::findOrFail($datos['unidad_id']);
        $normalizados = array_map(fn ($h) => $this->normalizar($h), $encabezados);

        $errores = [];
        $ignoradas = [];
        $codigos = [];
        $fallidas = 0;

        foreach ($datos['filas'] as $indice => $fila) {
            $nroFila = $indice + 1;
            $valoresFila = self::mapearFila($normalizados, is_array($fila) ? $fila : []);

            $preparada = $this->prepararFila($datos, $todasLasCategorias, $carga, $valoresFila, $normalizados, $encabezados, $ignoradas, $nroFila);

            if (isset($preparada['errores'])) {
                $fallos = $preparada['errores'];
            } else {
                $resultado = $this->ejecutarAlta($request, $preparada['payload']);
                $fallos = $resultado['errores'];

                if ($fallos === []) {
                    $codigos[] = $resultado['item']['codigo_unico'] ?? null;
                    continue;
                }
            }

            $fallidas++;

            foreach ($fallos as $campo => $mensajes) {
                foreach ((array) $mensajes as $mensaje) {
                    $errores[] = ['fila' => $nroFila, 'campo' => $campo, 'mensaje' => (string) $mensaje];
                }
            }
        }

        $respuesta = [
            'import_uuid' => $datos['import_uuid'],
            'lote' => $datos['lote'],
            'total' => count($datos['filas']),
            'insertados' => count($datos['filas']) - $fallidas,
            'fallidas' => $fallidas,
            'errores' => $errores,
            'codigos' => array_values(array_filter($codigos)),
            'duplicado' => false,
        ];

        $registro->update([
            'insertados' => $respuesta['insertados'],
            'fallidas' => $fallidas,
            'estado' => 'completado',
            'resultado' => $respuesta,
        ]);

        return response()->json($respuesta);
    }

    /**
     * Ocupa el par (import_uuid, lote) o devuelve la respuesta del intento
     * anterior. Devuelve un Importacion si hay que procesar, o una respuesta
     * lista si el lote ya existe.
     */
    private function reservarLote(array $datos, $user): Importacion|JsonResponse
    {
        $existente = Importacion::where('import_uuid', $datos['import_uuid'])
            ->where('lote', $datos['lote'])
            ->first();

        if ($existente) {
            return $this->loteYaProcesado($existente);
        }

        try {
            return Importacion::create([
                'import_uuid' => $datos['import_uuid'],
                'lote' => $datos['lote'],
                'filas' => count($datos['filas']),
                'user_id' => $user->id,
                'estado' => 'en_progreso',
            ]);
        } catch (QueryException) {
            // Llegaron dos requests con el mismo lote al mismo tiempo: gano el
            // indice unico, y este se rinde sin insertar nada.
            $otro = Importacion::where('import_uuid', $datos['import_uuid'])
                ->where('lote', $datos['lote'])
                ->first();

            return $otro
                ? $this->loteYaProcesado($otro)
                : response()->json(['message' => 'No se pudo reservar el lote. Volvé a intentar.'], 409);
        }
    }

    private function loteYaProcesado(Importacion $registro): JsonResponse
    {
        if ($registro->estado === 'completado') {
            return response()->json(array_merge($registro->resultado ?? [], ['duplicado' => true]));
        }

        return response()->json([
            'message' => "El lote {$registro->lote} quedó interrumpido. Revisá los ítems cargados antes de volver a enviarlo.",
            'import_uuid' => $registro->import_uuid,
            'lote' => $registro->lote,
        ], 409);
    }

    /**
     * Convierte la fila en el payload del alta, chequeando primero las reglas
     * que store() no puede chequear porque no ve la planilla (categoria
     * transitoria, elemento inexistente). No toca la base.
     *
     * Devuelve ['payload' => ...] si esta lista o ['errores' => ...] si no.
     *
     * @param  array<string>  $normalizados
     * @param  array<int, string>  $encabezados
     * @param  array<string, array<int, int>>  $ignoradas
     * @return array{payload?: array<string, mixed>, errores?: array<string, array<int, string>>}
     */
    private function prepararFila(
        array $datos,
        $categorias,
        Unidad $carga,
        array $valoresFila,
        array $normalizados,
        array $encabezados,
        array &$ignoradas,
        int $nroFila,
    ): array {
        $codigoColumna = $valoresFila['categoria'] ?? null;
        $codigoCategoria = $this->normalizar($this->valorColumna('categoria', $valoresFila) ?? '');
        $categoria = $categorias->first(fn ($c) => $this->normalizar($c->codigo) === $codigoCategoria);

        if (! $categoria) {
            return ['errores' => ['categoria' => [$codigoCategoria === ''
                ? "Falta la columna 'categoria'"
                : "Categoría desconocida: '{$codigoColumna}'"]]];
        }

        if ($categoria->es_transitoria) {
            return ['errores' => ['categoria' => ["{$categoria->codigo} es una categoría de tránsito: no admite carga directa"]]];
        }

        $tipoItem = null;
        if ($categoria->tiposItems->isNotEmpty()) {
            $nombreElemento = $this->normalizar($this->valorColumna('elemento', $valoresFila) ?? '');

            if ($nombreElemento !== '') {
                $tipoItem = $categoria->tiposItems
                    ->first(fn ($tipo) => $this->normalizar($tipo->nombre) === $nombreElemento);

                if (! $tipoItem) {
                    return ['errores' => ['elemento' => ["'{$this->valorColumna('elemento', $valoresFila)}' no es un elemento de {$categoria->codigo}"]]];
                }
            }
            // Sin nombre de elemento se deja que store() responda con su
            // mensaje habitual ("Seleccioná un elemento para esta categoría").
        }

        $campos = $categoria->camposDinamicos()
            ->where('activo', true)
            ->when(
                $tipoItem,
                fn ($q) => $q->where('tipo_item_id', $tipoItem->id),
                fn ($q) => $q->whereNull('tipo_item_id')
            )
            ->get();

        $porNombre = $campos->keyBy(fn ($campo) => $this->normalizar($campo->nombre));
        $valores = [];

        foreach ($valoresFila as $clave => $valor) {
            if (isset(self::COLUMNAS_FIJAS[$clave])) {
                continue;
            }

            if ($porNombre->has($clave)) {
                $texto = trim((string) ($valor ?? ''));
                if ($texto !== '') {
                    $valores[$porNombre[$clave]->id] = $texto;
                }
                continue;
            }

            $columna = $this->nombreColumna($clave, $normalizados, $encabezados) ?? $clave;
            $ignoradas[$columna][] = $nroFila;
        }

        $estadoCrudo = trim((string) ($this->valorColumna('estado_conservacion', $valoresFila) ?? ''));
        $estado = null;
        if ($estadoCrudo !== '') {
            $estado = self::ESTADOS[$this->normalizar($estadoCrudo)] ?? false;
            if ($estado === false) {
                return ['errores' => ['estado_conservacion' => ["'{$estadoCrudo}' no es un estado válido. Usa: Muy bueno, Bueno, Regular o Malo"]]];
            }
        }

        return ['payload' => [
            'categoria_id' => $categoria->id,
            'tipo_item_id' => $tipoItem?->id,
            'estado_conservacion' => $estado,
            'cantidad' => $this->normalizarCantidad($this->valorColumna('cantidad', $valoresFila)),
            'unidad_id' => $carga->id,
            'motivo_alta' => $datos['motivo_alta'],
            'fecha_alta' => $this->normalizarFecha($this->valorColumna('fecha_alta', $valoresFila))
                ?? ($datos['fecha_alta'] ?? null),
            'valores' => $valores,
        ]];
    }

    /**
     * Corre la validacion real del alta dentro de una transaccion que siempre
     * se revierte: el alta se ejecuta, se chequean las reglas y despues no
     * queda nada grabado. Si store() falla a mitad, su propia transaccion ya
     * se revertio y esta queda sana para la fila siguiente.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, array<int, string>>
     */
    private function probarAlta(Request $request, array $payload): array
    {
        DB::beginTransaction();

        try {
            return $this->llamarAlta($request, $payload)['errores'];
        } catch (\Throwable $e) {
            return ['general' => [$e->getMessage()]];
        } finally {
            DB::rollBack();
        }
    }

    /**
     * Prepara la fila y la somete a store() sin persistir nada.
     *
     * @param  array<string>  $normalizados
     * @param  array<int, string>  $encabezados
     * @param  array<string, array<int, int>>  $ignoradas
     * @return array<string, array<int, string>>
     */
    private function probarFila(
        Request $request,
        array $datos,
        $categorias,
        Unidad $carga,
        array $valoresFila,
        array $normalizados,
        array $encabezados,
        array &$ignoradas,
        int $nroFila,
    ): array {
        $preparada = $this->prepararFila($datos, $categorias, $carga, $valoresFila, $normalizados, $encabezados, $ignoradas, $nroFila);

        if (isset($preparada['errores'])) {
            return $preparada['errores'];
        }

        return $this->probarAlta($request, $preparada['payload']);
    }

    /**
     * Ejecuta el alta de verdad. La atomicidad por fila la garantiza store(),
     * que ya corre dentro de su propia transaccion: si una fila falla, las
     * anteriores siguen y la siguiente puede seguir igual.
     *
     * @param  array<string, mixed>  $payload
     * @return array{errores: array<string, array<int, string>>, item: array<string, mixed>|null}
     */
    private function ejecutarAlta(Request $request, array $payload): array
    {
        try {
            return $this->llamarAlta($request, $payload);
        } catch (\Throwable $e) {
            return ['errores' => ['general' => [$e->getMessage()]], 'item' => null];
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{errores: array<string, array<int, string>>, item: array<string, mixed>|null}
     */
    private function llamarAlta(Request $request, array $payload): array
    {
        $falsa = Request::create('/api/items', 'POST', $payload);
        $falsa->setUserResolver(fn () => $request->user());

        try {
            $respuesta = $this->items->store($falsa);
        } catch (ValidationException $e) {
            return ['errores' => $e->errors(), 'item' => null];
        }

        if ($respuesta->getStatusCode() >= 400) {
            $cuerpo = $respuesta->getData(true);

            return [
                'errores' => $cuerpo['errors'] ?? ['general' => [$cuerpo['message'] ?? 'No se pudo validar la fila']],
                'item' => null,
            ];
        }

        return ['errores' => [], 'item' => $respuesta->getData(true)['item'] ?? null];
    }

    /** @param  array<int, mixed>  $valores */
    private static function mapearFila(array $normalizados, array $valores): array
    {
        $fila = [];

        foreach ($normalizados as $i => $clave) {
            if (! array_key_exists($clave, $fila)) {
                $fila[$clave] = $valores[$i] ?? null;
            }
        }

        return $fila;
    }

    /**
     * Busca una columna fija dentro de la fila mapeada. La fila usa la clave
     * normalizada del encabezado ("estado conservacion", con espacio), en
     * cambio aca se pide la canonica ("estado_conservacion", con guion bajo).
     */
    private function valorColumna(string $claveCanonica, array $valoresFila): mixed
    {
        foreach ($valoresFila as $clave => $valor) {
            if ((self::COLUMNAS_FIJAS[$clave] ?? $clave) === $claveCanonica) {
                return $valor;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $encabezados
     */
    private function indiceColumna(string $claveCanonica, array $encabezados): ?int
    {
        foreach ($encabezados as $i => $encabezado) {
            $normalizado = $this->normalizar($encabezado);

            if ((self::COLUMNAS_FIJAS[$normalizado] ?? $normalizado) === $claveCanonica) {
                return $i;
            }
        }

        return null;
    }

    private function nombreColumna(string $clave, array $normalizados, array $encabezados): ?string
    {
        $i = array_search($clave, $normalizados, true);

        return $i === false ? null : ($encabezados[$i] ?? null);
    }

    private function normalizar(?string $texto): string
    {
        $texto = mb_strtolower(trim((string) $texto));
        $texto = strtr($texto, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
        $texto = (string) preg_replace('/[\s_\-\/\.]+/u', ' ', $texto);

        return trim($texto);
    }

    private function normalizarCantidad(mixed $valor): mixed
    {
        $texto = trim((string) ($valor ?? ''));

        if ($texto === '') {
            return 1;
        }

        $limpio = str_replace(',', '.', $texto);

        // "1", "1.0" o "1,0" son el mismo entero para la regla del alta.
        if (preg_match('/^\d+(?:\.0+)?$/', $limpio)) {
            return (int) $limpio;
        }

        return $texto;
    }

    /**
     * Acepta AAAA-MM-DD, MM/DD/AAAA, AAAAMMDD y el número serial de Excel.
     * Devuelve null si no hay fecha (el alta usa hoy por defecto).
     */
    private function normalizarFecha(mixed $valor): ?string
    {
        $texto = trim((string) ($valor ?? ''));

        if ($texto === '') {
            return null;
        }

        if (str_contains($texto, 'T')) {
            $texto = substr($texto, 0, 10);
        }

        if (preg_match('/^\d{8}$/', $texto)) {
            return substr($texto, 0, 4).'-'.substr($texto, 4, 2).'-'.substr($texto, 6, 2);
        }

        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $texto, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }

        if (preg_match('/^\d+(?:\.\d+)?$/', $texto)) {
            $serial = (int) $texto;

            if ($serial >= 20000 && $serial <= 60000) {
                return (new \DateTimeImmutable('1899-12-30'))
                    ->modify("+{$serial} days")
                    ->format('Y-m-d');
            }
        }

        return $texto;
    }

    private function opcionesPlanas(mixed $opciones): ?array
    {
        if (is_array($opciones)) {
            return array_values($opciones);
        }

        if (is_string($opciones) && trim($opciones) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $opciones))));
        }

        return null;
    }
}
