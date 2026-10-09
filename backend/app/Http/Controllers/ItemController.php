<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\TipoItem;
use App\Models\Unidad;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    /**
     * Campos cuyo valor se guarda siempre en mayusculas (unidades de medida,
     * calibres de armamento y patentes).
     */
    private const CAMPOS_MAYUSCULAS = [
        'Calibre (MM)',
        'Medidas',
        'Capacidad (BTU)',
        'Capacidad (L)',
        'Capacidad (RPM)',
        'Capacidad (W)',
        'Capacidad (VA)',
        'Potencia (W)',
        'Tamaño (pulgadas)',
        'Dominio',
        'Año',
    ];

    /**
     * Limite de los campos de texto largo (textarea), p. ej. Observaciones.
     */
    private const LIMITE_TEXTO_LARGO = 150;

    public function index(Request $request): JsonResponse
    {
        $query = Item::with(['categoria', 'tipoItem', 'responsable', 'unidad.sede'])
            ->orderByDesc('created_at');

if ($request->filled('search')) {
            $termino = $request->string('search');
            $driver = DB::connection()->getDriverName();
            $jsonCast = $driver === 'pgsql' ? 'TEXT' : 'CHAR';
            // En PostgreSQL LIKE distingue mayusculas; ILIKE las ignora.
            $like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
            $query->where(function ($q) use ($termino, $jsonCast, $like) {
                $q->where('codigo_unico', $like, "%{$termino}%")
                    ->orWhere('estado_conservacion', $like, "%{$termino}%")
                    ->orWhere('estado', $like, "%{$termino}%")
                    ->orWhereRaw("CAST(valores_dinamicos AS {$jsonCast}) {$like} ?", ["%{$termino}%"])
                    ->orWhereHas('categoria', function ($cq) use ($termino, $like) {
                        $cq->where('codigo', $like, "%{$termino}%")
                            ->orWhere('nombre', $like, "%{$termino}%");
                    })
                    ->orWhereHas('tipoItem', function ($tq) use ($termino, $like) {
                        $tq->where('nombre', $like, "%{$termino}%");
                    })
                    ->orWhereHas('unidad', function ($uq) use ($termino, $like) {
                        $uq->where('nombre', $like, "%{$termino}%");
                    })
                    ->orWhereHas('responsable', function ($rq) use ($termino, $like) {
                        $rq->where('name', $like, "%{$termino}%");
                    });
            });
        }

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('estado_conservacion')) {
            $query->where('estado_conservacion', $request->string('estado_conservacion'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('unidad_id')) {
            $query->where('unidad_id', $request->integer('unidad_id'));
        }

        $perPage = min(max($request->integer('per_page', 25), 1), 100);
        $items = $query->paginate($perPage)->withQueryString();

        return response()->json($items);
    }

    private function camposActivos(Categoria $categoria, ?int $tipoItemId)
    {
        $query = $categoria->camposDinamicos()->where('activo', true);

        if ($tipoItemId) {
            $query->where('tipo_item_id', $tipoItemId);
        } else {
            $query->whereNull('tipo_item_id');
        }

        return $query->orderBy('orden')->get();
    }

    /**
     * Aplica las reglas de formato sobre los valores dinamicos: limite de
     * caracteres en campos de texto largo y mayusculas en campos de medida.
     * Devuelve null si todo esta bien o la respuesta 422 si hay un exceso.
     */
    private function validarValores($campos, array &$valores): ?JsonResponse
    {
        foreach ($campos as $campo) {
            $valor = $valores[$campo->id] ?? null;

            if ($valor === null || $valor === '') {
                continue;
            }

            $valor = (string) $valor;

            if ($campo->tipo === 'textarea' && mb_strlen($valor) > self::LIMITE_TEXTO_LARGO) {
                $mensaje = "El campo '{$campo->nombre}' admite hasta ".self::LIMITE_TEXTO_LARGO.' caracteres';

                return response()->json([
                    'message' => $mensaje,
                    'errors' => ['valores' => [$mensaje]],
                ], 422);
            }

            if (in_array($campo->nombre, self::CAMPOS_MAYUSCULAS, true)) {
                $valores[$campo->id] = mb_strtoupper($valor);
            }
        }

        return null;
    }

    /**
     * Si la categoria tiene elementos, el alta o la edicion deben indicar
     * cual de ellos es el item. Sin elemento no existen campos que validar:
     * se saltarian las reglas de obligatorios, mayusculas y largo maximo.
     */
    private function exigirElemento(Categoria $categoria, ?int $tipoItemId): ?JsonResponse
    {
        if ($tipoItemId !== null || ! $categoria->tiposItems()->exists()) {
            return null;
        }

        $mensaje = 'Seleccioná un elemento para esta categoría';

        return response()->json([
            'message' => $mensaje,
            'errors' => ['tipo_item_id' => [$mensaje]],
        ], 422);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categoria_id' => ['required', Rule::exists('categorias', 'id')->where(fn ($q) => $q->where('es_transitoria', false))],
            'tipo_item_id' => ['nullable', 'integer', Rule::exists('tipos_items', 'id')->where(fn ($q) => $q->where('categoria_id', $request->integer('categoria_id')))],
            'estado_conservacion' => ['required', Rule::in(['Muy bueno', 'Bueno', 'Regular', 'Malo'])],
            'cantidad' => 'required|integer|min:1',
            'unidad_id' => ['required', 'integer', Rule::exists('unidades', 'id')],
            'motivo_alta' => 'required|string',
            'fecha_alta' => ['nullable', 'date', 'before_or_equal:today'],
            'valores' => 'nullable|array',
        ]);

        $categoria = Categoria::findOrFail($validated['categoria_id']);
        $user = $request->user();

        if ($error = $this->exigirElemento($categoria, $validated['tipo_item_id'] ?? null)) {
            return $error;
        }

        $campos = $this->camposActivos($categoria, $validated['tipo_item_id'] ?? null);
        $valores = $validated['valores'] ?? [];
        foreach ($campos->where('requerido', true) as $campo) {
            if (empty($valores[$campo->id])) {
                return response()->json([
                    'message' => "El campo '{$campo->nombre}' es obligatorio",
                    'errors' => ['valores' => ["El campo '{$campo->nombre}' es obligatorio"]],
                ], 422);
            }
        }

        if ($error = $this->validarValores($campos, $valores)) {
            return $error;
        }

        try {
            $this->enTransaccionReintentable(function () use (&$item, $request, $categoria, $user, $valores, $validated) {
                $codigo = $this->generarCodigoUnico($categoria->codigo, (int) $validated['unidad_id']);

                $item = Item::create([
                    'codigo_unico' => $codigo,
                    'categoria_id' => $categoria->id,
                    'tipo_item_id' => $validated['tipo_item_id'] ?? null,
                    'responsable_id' => $user->id,
                    'unidad_id' => $validated['unidad_id'],
                    'estado_conservacion' => $validated['estado_conservacion'],
                    'cantidad' => $validated['cantidad'],
                    'fecha_alta' => $validated['fecha_alta'] ?? now()->toDateString(),
                    'valores_dinamicos' => $valores,
                    'estado' => 'activo',
                ]);

                Movimiento::create([
                    'item_id' => $item->id,
                    'tipo' => 'alta',
                    'unidad_origen_id' => $validated['unidad_id'],
                    'unidad_destino_id' => null,
                    'motivo' => $validated['motivo_alta'],
                    'estado' => 'aprobado',
                    'solicitante_id' => $user->id,
                    'validador_id' => null,
                    'fecha_validacion' => now(),
                ]);

                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'crear',
                    'entidad' => 'item',
                    'entidad_id' => $item->id,
                    'detalle' => [
                        'codigo' => $codigo,
                        'categoria' => $categoria->codigo,
                        'tipo_item' => $item->tipoItem?->nombre ?? '-',
                        'unidad' => $item->unidad->nombre ?? '-',
                        'responsable' => $user->name,
                        'estado_conservacion' => $validated['estado_conservacion'],
                        'cantidad' => $validated['cantidad'],
                        'fecha_alta' => $validated['fecha_alta'] ?? now()->toDateString(),
                        'motivo_alta' => $validated['motivo_alta'],
                        'valores_dinamicos' => $valores,
                    ],
                ]);
            });

            $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

            return response()->json(['item' => $item], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al crear el ítem',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Item $item): JsonResponse
    {
        $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede', 'movimientos.solicitante', 'movimientos.validador', 'movimientos.unidadOrigen', 'movimientos.unidadDestino']);

        return response()->json(['item' => $item]);
    }

    public function update(Request $request, Item $item): JsonResponse
    {
        $validated = $request->validate([
            'categoria_id' => ['sometimes', 'integer', Rule::exists('categorias', 'id')->where(fn ($q) => $q->where('es_transitoria', false))],
            'tipo_item_id' => ['nullable', 'integer', Rule::exists('tipos_items', 'id')->where(fn ($q) => $q->where('categoria_id', $request->input('categoria_id', $item->categoria_id)))],
            'estado_conservacion' => ['sometimes', Rule::in(['Muy bueno', 'Bueno', 'Regular', 'Malo'])],
            'cantidad' => 'sometimes|integer|min:1',
            'valores' => 'nullable|array',
        ]);

        $user = $request->user();
        $item->load(['categoria', 'tipoItem', 'unidad']);

        $categoriaNuevaId = (int) ($validated['categoria_id'] ?? $item->categoria_id);
        $tipoNuevoId = array_key_exists('tipo_item_id', $validated)
            ? $validated['tipo_item_id']
            : $item->tipo_item_id;
        $cambiaCategoria = $categoriaNuevaId !== (int) $item->categoria_id;
        $categoriaNueva = Categoria::findOrFail($categoriaNuevaId);

        // Al cambiar de categoría, el elemento debe ser de la categoría nueva.
        // Si no se envía, sigue quedando el de la categoría anterior y la regla
        // `exists` no llega a aplicarse, así que se controla acá.
        if ($cambiaCategoria) {
            $tipoValido = $tipoNuevoId && TipoItem::where('id', $tipoNuevoId)
                ->where('categoria_id', $categoriaNuevaId)
                ->exists();

            if (!$tipoValido) {
                return response()->json([
                    'message' => 'Elegí un elemento de la categoría seleccionada.',
                    'errors' => ['tipo_item_id' => ['Seleccioná un elemento de la categoría nueva.']],
                ], 422);
            }
        }

        if ($error = $this->exigirElemento($categoriaNueva, $tipoNuevoId)) {
            return $error;
        }

        // Los campos obligatorios de la categoría/elemento final deben venir
        // completos. Si no se enviaron valores, se validan los que ya tiene el ítem.
        $camposFinales = $this->camposActivos($categoriaNueva, $tipoNuevoId ?: null);
        $valoresFinales = $validated['valores'] ?? $item->valores_dinamicos ?? [];
        foreach ($camposFinales->where('requerido', true) as $campo) {
            if (empty($valoresFinales[$campo->id])) {
                return response()->json([
                    'message' => "El campo '{$campo->nombre}' es obligatorio",
                    'errors' => ['valores' => ["El campo '{$campo->nombre}' es obligatorio"]],
                ], 422);
            }
        }

        if (array_key_exists('valores', $validated)) {
            if ($error = $this->validarValores($camposFinales, $valoresFinales)) {
                return $error;
            }
            $validated['valores'] = $valoresFinales;
        }

        $codigoAntes = $item->codigo_unico;
        $antesDinamicos = $item->valores_dinamicos ?? [];
        $antesRef = [
            'categoria' => $item->categoria->codigo ?? '-',
            'tipo_item' => $item->tipoItem->nombre ?? '-',
            'unidad' => $item->unidad->nombre ?? '-',
        ];
        $antesNumRef = $item->only(['estado_conservacion', 'cantidad']);

        $datos = $validated;
        if (array_key_exists('valores', $datos)) {
            $datos['valores_dinamicos'] = $datos['valores'];
            unset($datos['valores']);
        }

        try {
            $item = $this->enTransaccionReintentable(function () use ($item, $datos, $user, $antesRef, $antesNumRef, $antesDinamicos, $cambiaCategoria, $categoriaNueva, $codigoAntes) {
                $item->update($datos);

                // El código único lleva la categoría al principio (A5-120-842-…):
                // si cambió la categoría, se vuelve a generar para no contradecirlo.
                if ($cambiaCategoria) {
                    $item->update([
                        'codigo_unico' => $this->generarCodigoUnico($categoriaNueva->codigo, (int) $item->unidad_id),
                    ]);
                }

                $item->load(['categoria', 'tipoItem', 'unidad']);
                $despuesDinamicos = $item->valores_dinamicos ?? [];

                $antes = array_merge($antesRef, $antesNumRef);
                $despues = array_merge([
                    'categoria' => $item->categoria->codigo ?? '-',
                    'tipo_item' => $item->tipoItem->nombre ?? '-',
                    'unidad' => $item->unidad->nombre ?? '-',
                ], $item->only(['estado_conservacion', 'cantidad']));

                $todosLosIds = array_unique(array_merge(array_keys($antesDinamicos), array_keys($despuesDinamicos)));
                if (!empty($todosLosIds)) {
                    $todosCampos = \App\Models\CampoDinamico::whereIn('id', $todosLosIds)->get()->keyBy('id');
                    foreach ($todosLosIds as $campoId) {
                        $av = $antesDinamicos[$campoId] ?? null;
                        $dv = $despuesDinamicos[$campoId] ?? null;
                        if ((string)$av !== (string)$dv) {
                            $nombreCampo = $todosCampos[$campoId]->nombre ?? "Campo #{$campoId}";
                            $antes[$nombreCampo] = $av ?? '(vacío)';
                            $despues[$nombreCampo] = $dv ?? '(vacío)';
                        }
                    }
                }

                if ($codigoAntes !== $item->codigo_unico) {
                    $antes['codigo'] = $codigoAntes;
                    $despues['codigo'] = $item->codigo_unico;
                }

                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'editar',
                    'entidad' => 'item',
                    'entidad_id' => $item->id,
                    'detalle' => ['codigo' => $item->codigo_unico, 'antes' => $antes, 'despues' => $despues],
                ]);

                $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

                return $item;
            });

            return response()->json(['item' => $item]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al editar el ítem',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reactivar(Request $request, Item $item): JsonResponse
    {
        if ($item->estado !== 'baja') {
            return response()->json(['message' => 'Solo se pueden reactivar ítems en estado baja'], 422);
        }

        $validated = $request->validate([
            'motivo_reactivacion' => 'required|string|max:500',
        ]);

        $user = $request->user();

        try {
            DB::transaction(function () use ($item, $user, $validated) {
                $motivoBajaAnterior = $item->motivo_baja;

                // La categoría no se toca: el alta y la baja se reflejan en
                // `estado`, no en `categoria_id`.
                $item->update([
                    'estado' => 'activo',
                    'categoria_original_id' => null,
                    'motivo_baja' => null,
                    'fecha_baja' => null,
                ]);

                Movimiento::create([
                    'item_id' => $item->id,
                    'tipo' => 'alta',
                    'unidad_origen_id' => $item->unidad_id,
                    'unidad_destino_id' => null,
                    'motivo' => $validated['motivo_reactivacion'],
                    'estado' => 'aprobado',
                    'solicitante_id' => $user->id,
                    'validador_id' => $user->id,
                    'fecha_validacion' => now(),
                ]);

                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'reactivar',
                    'entidad' => 'item',
                    'entidad_id' => $item->id,
                    'detalle' => [
                        'codigo' => $item->codigo_unico,
                        'estado_anterior' => 'baja',
                        'estado_nuevo' => 'activo',
                        'categoria' => Categoria::find($item->categoria_id)?->codigo ?? '-',
                        'motivo_baja_anterior' => $motivoBajaAnterior ?? '-',
                        'motivo_reactivacion' => $validated['motivo_reactivacion'],
                    ],
                ]);
            });

            $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

            return response()->json(['item' => $item]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al reactivar el ítem',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, Item $item): JsonResponse
    {
        $user = $request->user();

        try {
            DB::transaction(function () use ($item, $user) {
                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'eliminar',
                    'entidad' => 'item',
                    'entidad_id' => $item->id,
                    'detalle' => [
                        'codigo' => $item->codigo_unico,
                        'categoria' => $item->categoria?->codigo,
                        'estado' => $item->estado,
                        'unidad' => $item->unidad?->nombre,
                        'responsable' => $item->responsable?->name,
                    ],
                ]);

                Alerta::where(fn ($q) => $q->where('item_id', $item->id)
                        ->orWhereIn('movimiento_id', Movimiento::where('item_id', $item->id)->pluck('id')))
                    ->update(['item_id' => null, 'movimiento_id' => null]);

                $item->delete();
            });

            return response()->json(['message' => 'Ítem eliminado']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al eliminar el ítem',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ejecuta la operacion dentro de una transaccion y la repite si la base
     * la rechazo por `codigo_unico` duplicado.
     *
     * Dos altas simultaneas de la misma unidad pueden leer el mismo maximo
     * antes de insertar: la segunda termina en violacion del unique. Al
     * reintentar la transaccion entera ya ve el codigo recien confirmado.
     * Solo se reintenta por ese motivo, nunca por cualquier QueryException.
     */
    private function enTransaccionReintentable(callable $operacion, int $intentos = 3): mixed
    {
        $intento = 0;

        while (true) {
            $intento++;

            try {
                return DB::transaction($operacion);
            } catch (QueryException $e) {
                if ($intento >= $intentos || ! str_contains($e->getMessage(), 'codigo_unico')) {
                    throw $e;
                }
            }
        }
    }

    private function generarCodigoUnico(string $codigoCategoria, int $unidadId): string
    {
        // Formato: {Categoria}-{IdSede 2}-{IdUnidad 2}-{orden 6} -> A1-03-47-000001
        $unidad = Unidad::findOrFail($unidadId);
        $prefijo = sprintf('%s-%02d-%02d-', $codigoCategoria, $unidad->sede_id, $unidadId);

        // FOR UPDATE sobre los codigos ya emitidos: dos transacciones que
        // calculan el proximo numero no pueden leer el mismo maximo a la vez.
        $ultimo = Item::where('codigo_unico', 'like', $prefijo.'%')
            ->orderByDesc('codigo_unico')
            ->lockForUpdate()
            ->value('codigo_unico');

        $nro = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return $prefijo.str_pad((string) $nro, 6, '0', STR_PAD_LEFT);
    }
}