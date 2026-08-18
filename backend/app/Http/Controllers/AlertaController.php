<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Auditoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AlertaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Alerta::with(['item.categoria', 'item.tipoItem', 'movimiento', 'area'])
            ->orderByDesc('created_at');

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->string('tipo'));
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->integer('area_id'));
        }

        return response()->json($query->paginate(50)->withQueryString());
    }

    public function cerrar(Request $request, Alerta $alerta): JsonResponse
    {
        if ($alerta->estado === 'cerrada') {
            return response()->json(['message' => 'La alerta ya está cerrada'], 422);
        }

        $alerta->update([
            'estado' => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'cerrar',
            'entidad' => 'alerta',
            'entidad_id' => $alerta->id,
            'detalle' => ['mensaje' => $alerta->mensaje],
        ]);

        $alerta->load(['item.categoria', 'item.tipoItem', 'movimiento', 'area']);

        return response()->json(['alerta' => $alerta]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mensaje' => 'required|string',
            'prioridad' => ['required', Rule::in(['critica', 'importante', 'informativa'])],
            'area_id' => ['required', 'integer', Rule::exists('areas', 'id')],
            'tipo' => ['nullable', Rule::in(['pendiente_aprobacion', 'pendiente_movimiento', 'manual'])],
            'item_id' => ['nullable', 'integer', Rule::exists('items', 'id')],
        ]);

        $alerta = Alerta::create([
            'mensaje' => $validated['mensaje'],
            'prioridad' => $validated['prioridad'],
            'area_id' => $validated['area_id'],
            'tipo' => $validated['tipo'] ?? 'manual',
            'item_id' => $validated['item_id'] ?? null,
            'estado' => 'abierta',
        ]);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'crear',
            'entidad' => 'alerta',
            'entidad_id' => $alerta->id,
            'detalle' => ['mensaje' => $alerta->mensaje, 'prioridad' => $alerta->prioridad],
        ]);

        return response()->json(['alerta' => $alerta], 201);
    }
}