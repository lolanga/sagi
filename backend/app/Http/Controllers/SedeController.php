<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\Sede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SedeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['sedes' => Sede::with('unidades')->orderBy('nombre')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $sede = Sede::create($validated);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'crear',
            'entidad' => 'sede',
            'entidad_id' => $sede->id,
            'detalle' => ['nombre' => $sede->nombre],
        ]);

        return response()->json(['sede' => $sede], 201);
    }

    public function update(Request $request, Sede $sede): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
        ]);

        $sede->update($validated);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'editar',
            'entidad' => 'sede',
            'entidad_id' => $sede->id,
            'detalle' => ['nombre' => $sede->nombre],
        ]);

        return response()->json(['sede' => $sede]);
    }

    public function destroy(Request $request, Sede $sede): JsonResponse
    {
        if ($sede->unidades()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar la sede porque tiene unidades de destino asociadas.',
            ], 422);
        }

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'eliminar',
            'entidad' => 'sede',
            'entidad_id' => $sede->id,
            'detalle' => ['nombre' => $sede->nombre],
        ]);

        $sede->delete();

        return response()->json(['message' => 'Sede eliminada']);
    }
}