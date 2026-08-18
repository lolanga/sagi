<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Item::with(['categoria', 'tipoItem', 'responsable', 'area'])
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $termino = $request->string('search');
            $query->where(function ($q) use ($termino) {
                $q->where('codigo_unico', 'like', "%{$termino}%")
                    ->orWhereRaw("CAST(valores_dinamicos AS CHAR) LIKE ?", ["%{$termino}%"]);
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

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->integer('area_id'));
        }

        $items = $query->paginate(25)->withQueryString();

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
            'motivo_alta' => 'required|string',
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
            $codigo = $this->generarCodigoUnico();

            // El ítem ingresa en A7 (Altas) y se traslada a su categoría real en el alta
            $item = Item::create([
                'codigo_unico' => $codigo,
                'categoria_id' => Categoria::where('codigo', 'A7')->value('id'),
                'tipo_item_id' => $validated['tipo_item_id'] ?? null,
                'responsable_id' => $user->id,
                'area_id' => $user->area_id,
                'estado_conservacion' => $validated['estado_conservacion'],
                'cantidad' => $validated['cantidad'],
                'fecha_alta' => now()->toDateString(),
                'valores_dinamicos' => $valores,
                'estado' => 'activo',
            ]);

            $alta = Movimiento::create([
                'item_id' => $item->id,
                'tipo' => 'alta',
                'area_origen_id' => $user->area_id,
                'area_destino_id' => null,
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
                'detalle' => ['codigo' => $codigo, 'categoria' => $categoria->codigo, 'movimiento_id' => $alta->id],
            ]);
        });

        $item->load(['categoria', 'tipoItem', 'responsable', 'area']);

        return response()->json(['item' => $item], 201);
    }

    public function show(Item $item): JsonResponse
    {
        $item->load(['categoria', 'tipoItem', 'responsable', 'area', 'movimientos.solicitante', 'movimientos.validador', 'movimientos.areaOrigen', 'movimientos.areaDestino']);

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
        $antes = $item->only(['categoria_id', 'estado_conservacion', 'cantidad', 'valores_dinamicos']);

        $datos = $validated;
        if (array_key_exists('valores', $datos)) {
            $datos['valores_dinamicos'] = $datos['valores'];
            unset($datos['valores']);
        }

        $item->update($datos);

        Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'editar',
            'entidad' => 'item',
            'entidad_id' => $item->id,
            'detalle' => ['antes' => $antes, 'despues' => $item->only(['categoria_id', 'estado_conservacion', 'cantidad', 'valores_dinamicos'])],
        ]);

        $item->load(['categoria', 'tipoItem', 'responsable', 'area']);

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
                'detalle' => ['codigo' => $item->codigo_unico],
            ]);

            $item->movimientos()->delete();
            $item->delete();
        });

        return response()->json(['message' => 'Ítem eliminado']);
    }

    private function generarCodigoUnico(): string
    {
        $ultimo = Item::orderByDesc('codigo_unico')->value('codigo_unico');
        $nro = 1;

        if ($ultimo && preg_match('/(\d+)$/', $ultimo, $m)) {
            $nro = (int) $m[1] + 1;
        }

        return 'SAGI-' . str_pad((string) $nro, 6, '0', STR_PAD_LEFT);
    }
}