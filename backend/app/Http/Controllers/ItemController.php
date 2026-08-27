<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\Unidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Item::with(['categoria', 'tipoItem', 'responsable', 'unidad.sede'])
            ->orderByDesc('created_at');

if ($request->filled('search')) {
            $termino = $request->string('search');
            $query->where(function ($q) use ($termino) {
                $q->where('codigo_unico', 'like', "%{$termino}%")
                    ->orWhere('estado_conservacion', 'like', "%{$termino}%")
                    ->orWhere('estado', 'like', "%{$termino}%")
                    ->orWhereRaw("CAST(valores_dinamicos AS CHAR) LIKE ?", ["%{$termino}%"])
                    ->orWhereHas('categoria', function ($cq) use ($termino) {
                        $cq->where('codigo', 'like', "%{$termino}%")
                            ->orWhere('nombre', 'like', "%{$termino}%");
                    })
                    ->orWhereHas('tipoItem', function ($tq) use ($termino) {
                        $tq->where('nombre', 'like', "%{$termino}%");
                    })
                    ->orWhereHas('unidad', function ($uq) use ($termino) {
                        $uq->where('nombre', 'like', "%{$termino}%");
                    })
                    ->orWhereHas('responsable', function ($rq) use ($termino) {
                        $rq->where('name', 'like', "%{$termino}%");
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

        // Validar campos dinámicos requeridos del elemento (o de la categoría)
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

        DB::transaction(function () use (&$item, $request, $categoria, $user, $valores, $validated) {
            $codigo = $this->generarCodigoUnico($categoria->codigo, (int) $validated['unidad_id']);

            // El ítem ingresa en A7 (Altas) y se traslada a su categoría real en el alta
            $item = Item::create([
                'codigo_unico' => $codigo,
                'categoria_id' => Categoria::where('codigo', 'A7')->value('id'),
                'tipo_item_id' => $validated['tipo_item_id'] ?? null,
                'responsable_id' => $user->id,
                'unidad_id' => $validated['unidad_id'],
                'estado_conservacion' => $validated['estado_conservacion'],
                'cantidad' => $validated['cantidad'],
                'fecha_alta' => $validated['fecha_alta'] ?? now()->toDateString(),
                'valores_dinamicos' => $valores,
                'estado' => 'activo',
            ]);

            $alta = Movimiento::create([
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

            // Traslado automático de A7 a la categoría real
            $item->update(['categoria_id' => $categoria->id]);

            Auditoria::create([
                'user_id' => $user->id,
                'accion' => 'crear',
                'entidad' => 'item',
                'entidad_id' => $item->id,
                'detalle' => [
                    'codigo' => $codigo,
                    'categoria' => $categoria->codigo,
                    'unidad' => $item->unidad->nombre ?? '-',
                ],
            ]);
        });

        $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

        return response()->json(['item' => $item], 201);
    }

    public function show(Item $item): JsonResponse
    {
        $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede', 'movimientos.solicitante', 'movimientos.validador', 'movimientos.unidadOrigen', 'movimientos.unidadDestino']);

        return response()->json(['item' => $item]);
    }

    public function update(Request $request, Item $item): JsonResponse
    {
        $validated = $request->validate([
            'categoria_id' => ['sometimes', Rule::exists('categorias', 'id')->where(fn ($q) => $q->where('es_transitoria', false))],
            'tipo_item_id' => ['nullable', 'integer', Rule::exists('tipos_items', 'id')->where(fn ($q) => $q->where('categoria_id', $request->input('categoria_id', $item->categoria_id)))],
            'estado_conservacion' => ['sometimes', Rule::in(['Muy bueno', 'Bueno', 'Regular', 'Malo'])],
            'cantidad' => 'sometimes|integer|min:1',
            'valores' => 'nullable|array',
        ]);

        $user = $request->user();
        $item->load(['categoria', 'tipoItem', 'unidad']);
        $antesNumericos = $item->only(['estado_conservacion', 'cantidad']);
        $antesDinamicos = $item->valores_dinamicos ?? [];

        $datos = $validated;
        if (array_key_exists('valores', $datos)) {
            $datos['valores_dinamicos'] = $datos['valores'];
            unset($datos['valores']);
        }

        $item->update($datos);
        $item->load(['categoria', 'tipoItem', 'unidad']);
        $despuesDinamicos = $item->valores_dinamicos ?? [];

        $antes = array_merge([
            'categoria' => $item->categoria->codigo ?? '-',
            'tipo_item' => $item->tipoItem->nombre ?? '-',
            'unidad' => $item->unidad->nombre ?? '-',
        ], $antesNumericos);

        $despues = array_merge([
            'categoria' => $item->categoria->codigo ?? '-',
            'tipo_item' => $item->tipoItem->nombre ?? '-',
            'unidad' => $item->unidad->nombre ?? '-',
        ], $item->only(['estado_conservacion', 'cantidad']));

        $camposDinamicos = $item->categoria->camposDinamicos()->get()->keyBy('id');
        $todosLosIds = array_unique(array_merge(array_keys($antesDinamicos), array_keys($despuesDinamicos)));
        foreach ($todosLosIds as $campoId) {
            $av = $antesDinamicos[$campoId] ?? null;
            $dv = $despuesDinamicos[$campoId] ?? null;
            if (String($av) !== String($dv)) {
                $nombreCampo = $camposDinamicos[$campoId]->nombre ?? "Campo #{$campoId}";
                $antes[$nombreCampo] = $av ?? '(vacío)';
                $despues[$nombreCampo] = $dv ?? '(vacío)';
            }
        }

        Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'editar',
            'entidad' => 'item',
            'entidad_id' => $item->id,
            'detalle' => ['antes' => $antes, 'despues' => $despues],
        ]);

        $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

        return response()->json(['item' => $item]);
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

        DB::transaction(function () use ($item, $user, $validated) {
            $categoriaOriginalId = $item->categoria_original_id ?? $item->categoria_id;

            $item->update([
                'estado' => 'activo',
                'categoria_id' => $categoriaOriginalId,
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
                    'categoria' => $item->categoria->codigo ?? '-',
                    'motivo' => $validated['motivo_reactivacion'],
                ],
            ]);
        });

        $item->load(['categoria', 'tipoItem', 'responsable', 'unidad.sede']);

        return response()->json(['item' => $item]);
    }

    public function destroy(Request $request, Item $item): JsonResponse
    {
        $user = $request->user();

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

            Alerta::where('item_id', $item->id)
                ->update(['item_id' => null]);

            $item->movimientos()->update(['item_id' => null]);
            $item->delete();
        });

        return response()->json(['message' => 'Ítem eliminado']);
    }

    private function generarCodigoUnico(string $codigoCategoria, int $unidadId): string
    {
        // Formato: {Categoria}-{IdSede 2}-{IdUnidad 2}-{orden 6} -> A1-03-47-000001
        $unidad = Unidad::findOrFail($unidadId);
        $prefijo = sprintf('%s-%02d-%02d-', $codigoCategoria, $unidad->sede_id, $unidadId);

        $ultimo = Item::where('codigo_unico', 'like', $prefijo.'%')
            ->orderByDesc('codigo_unico')
            ->value('codigo_unico');

        $nro = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return $prefijo.str_pad((string) $nro, 6, '0', STR_PAD_LEFT);
    }
}