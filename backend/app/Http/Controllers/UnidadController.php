<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\Unidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnidadController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['unidades' => Unidad::with('sede')->orderBy('nombre')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'sede_id' => ['required', 'integer', Rule::exists('sedes', 'id')],
        ]);

        $unidad = Unidad::create($validated);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'crear',
            'entidad' => 'unidad',
            'entidad_id' => $unidad->id,
            'detalle' => ['nombre' => $unidad->nombre, 'sede_id' => $unidad->sede_id],
        ]);

        return response()->json(['unidad' => $unidad->load('sede')], 201);
    }

    public function update(Request $request, Unidad $unidad): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'sede_id' => ['sometimes', 'integer', Rule::exists('sedes', 'id')],
        ]);

        $unidad->update($validated);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'editar',
            'entidad' => 'unidad',
            'entidad_id' => $unidad->id,
            'detalle' => ['nombre' => $unidad->nombre, 'sede_id' => $unidad->sede_id],
        ]);

        return response()->json(['unidad' => $unidad->load('sede')]);
    }

    public function destroy(Request $request, Unidad $unidad): JsonResponse
    {
        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'eliminar',
            'entidad' => 'unidad',
            'entidad_id' => $unidad->id,
            'detalle' => ['nombre' => $unidad->nombre],
        ]);

        $unidad->delete();

        return response()->json(['message' => 'Unidad eliminada']);
    }
}