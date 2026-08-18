<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MovimientoController extends Controller
{
    private function crearAlerta(Movimiento $m, Item $item): void
    {
        Alerta::create([
            'tipo' => 'pendiente_aprobacion',
            'prioridad' => $m->tipo === 'baja' ? 'critica' : 'importante',
            'estado' => 'abierta',
            'item_id' => $item->id,
            'movimiento_id' => $m->id,
            'area_id' => $item->area_id,
            'mensaje' => sprintf(
                '%s pendiente de aprobación para el ítem %s (%s)',
                $m->tipo === 'traslado' ? 'Traslado' : 'Baja',
                $item->codigo_unico,
                $item->tipoItem?->nombre ?? 'sin elemento'
            ),
        ]);
    }

    private function cerrarAlertas(Movimiento $m): void
    {
        Alerta::where('movimiento_id', $m->id)
            ->where('estado', 'abierta')
            ->update(['estado' => 'cerrada', 'fecha_cierre' => now()]);
    }
    public function index(Request $request): JsonResponse
    {
        $query = Movimiento::with([
            'item.categoria',
            'item.tipoItem',
            'areaOrigen',
            'areaDestino',
            'solicitante',
            'validador',
        ])->orderByDesc('created_at');

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->string('tipo'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->integer('item_id'));
        }

        return response()->json($query->paginate(25)->withQueryString());
    }

    public function storeTraslado(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', Rule::exists('items', 'id')->where(fn ($q) => $q->where('estado', 'activo'))],
            'area_destino_id' => ['required', 'integer', Rule::exists('areas', 'id')],
            'motivo' => 'required|string',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $user = $request->user();

        if ((int) $validated['area_destino_id'] === (int) $item->area_id) {
            return response()->json(['message' => 'El área de destino es la misma que el área actual del ítem'], 422);
        }

        $movimiento = DB::transaction(function () use ($item, $validated, $user) {
            $m = Movimiento::create([
                'item_id' => $item->id,
                'tipo' => 'traslado',
                'area_origen_id' => $item->area_id,
                'area_destino_id' => $validated['area_destino_id'],
                'motivo' => $validated['motivo'],
                'estado' => 'pendiente',
                'solicitante_id' => $user->id,
            ]);

            Auditoria::create([
                'user_id' => $user->id,
                'accion' => 'solicitar',
                'entidad' => 'movimiento',
                'entidad_id' => $m->id,
                'detalle' => [
                    'tipo' => 'traslado',
                    'item' => $item->codigo_unico,
                    'area_origen' => $item->area_id,
                    'area_destino' => $validated['area_destino_id'],
                    'motivo' => $validated['motivo'],
                ],
            ]);

            $this->crearAlerta($m, $item);

            return $m;
        });

        $movimiento->load(['item.categoria', 'item.tipoItem', 'areaOrigen', 'areaDestino', 'solicitante', 'validador']);

        return response()->json(['movimiento' => $movimiento], 201);
    }

    public function storeBaja(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', Rule::exists('items', 'id')->where(fn ($q) => $q->where('estado', 'activo'))],
            'motivo' => 'required|string',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $user = $request->user();

        $movimiento = DB::transaction(function () use ($item, $validated, $user) {
            $m = Movimiento::create([
                'item_id' => $item->id,
                'tipo' => 'baja',
                'area_origen_id' => $item->area_id,
                'area_destino_id' => null,
                'motivo' => $validated['motivo'],
                'estado' => 'pendiente',
                'solicitante_id' => $user->id,
            ]);

            Auditoria::create([
                'user_id' => $user->id,
                'accion' => 'solicitar',
                'entidad' => 'movimiento',
                'entidad_id' => $m->id,
                'detalle' => [
                    'tipo' => 'baja',
                    'item' => $item->codigo_unico,
                    'area_origen' => $item->area_id,
                    'motivo' => $validated['motivo'],
                ],
            ]);

            $this->crearAlerta($m, $item);

            return $m;
        });

        $movimiento->load(['item.categoria', 'item.tipoItem', 'areaOrigen', 'areaDestino', 'solicitante', 'validador']);

        return response()->json(['movimiento' => $movimiento], 201);
    }

    public function aprobar(Request $request, Movimiento $movimiento): JsonResponse
    {
        if ($movimiento->estado !== 'pendiente') {
            return response()->json(['message' => 'El movimiento ya fue procesado'], 422);
        }

        $user = $request->user();
        $item = $movimiento->item;

        DB::transaction(function () use ($movimiento, $item, $user) {
            if ($movimiento->tipo === 'traslado') {
                $item->update(['area_id' => $movimiento->area_destino_id]);
            }

            if ($movimiento->tipo === 'baja') {
                $item->update([
                    'estado' => 'baja',
                    'categoria_id' => Categoria::where('codigo', 'A8')->value('id') ?? $item->categoria_id,
                ]);
            }

            $movimiento->update([
                'estado' => 'aprobado',
                'validador_id' => $user->id,
                'fecha_validacion' => now(),
            ]);

            $this->cerrarAlertas($movimiento);

            Auditoria::create([
                'user_id' => $user->id,
                'accion' => 'aprobar',
                'entidad' => 'movimiento',
                'entidad_id' => $movimiento->id,
                'detalle' => [
                    'tipo' => $movimiento->tipo,
                    'item' => $item->codigo_unico,
                    'estado_item' => $item->estado,
                ],
            ]);
        });

        $movimiento->load(['item.categoria', 'item.tipoItem', 'areaOrigen', 'areaDestino', 'solicitante', 'validador']);

        return response()->json(['movimiento' => $movimiento]);
    }

    public function rechazar(Request $request, Movimiento $movimiento): JsonResponse
    {
        if ($movimiento->estado !== 'pendiente') {
            return response()->json(['message' => 'El movimiento ya fue procesado'], 422);
        }

        $validated = $request->validate([
            'motivo_rechazo' => 'required|string',
        ]);

        $user = $request->user();

        $movimiento->update([
            'estado' => 'rechazado',
            'validador_id' => $user->id,
            'fecha_validacion' => now(),
            'motivo_rechazo' => $validated['motivo_rechazo'],
        ]);

        $this->cerrarAlertas($movimiento);

        Auditoria::create([
            'user_id' => $user->id,
            'accion' => 'rechazar',
            'entidad' => 'movimiento',
            'entidad_id' => $movimiento->id,
            'detalle' => [
                'tipo' => $movimiento->tipo,
                'item' => $movimiento->item->codigo_unico,
                'motivo_rechazo' => $validated['motivo_rechazo'],
            ],
        ]);

        $movimiento->load(['item.categoria', 'item.tipoItem', 'areaOrigen', 'areaDestino', 'solicitante', 'validador']);

        return response()->json(['movimiento' => $movimiento]);
    }
}