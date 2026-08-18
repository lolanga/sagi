<?php

namespace App\Http\Controllers;

use App\Models\CampoDinamico;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::with(['camposDinamicos'])->orderBy('codigo')->get();

        return response()->json(['categorias' => $categorias]);
    }

    public function campos(Categoria $categoria): JsonResponse
    {
        return response()->json(['campos' => $categoria->camposDinamicos]);
    }

    public function storeCampo(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'requerido' => 'nullable|boolean',
        ]);

        $campo = $categoria->camposDinamicos()->create([
            'nombre' => $validated['nombre'],
            'tipo' => $validated['tipo'],
            'opciones' => $validated['opciones'] ?? null,
            'requerido' => $validated['requerido'] ?? false,
            'activo' => true,
            'orden' => $categoria->camposDinamicos()->count(),
        ]);

        return response()->json(['campo' => $campo], 201);
    }

    public function updateCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'tipo' => 'sometimes|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'requerido' => 'nullable|boolean',
            'activo' => 'nullable|boolean',
            'orden' => 'nullable|integer',
        ]);

        $campo->update($validated);

        return response()->json(['campo' => $campo]);
    }

    public function destroyCampo(CampoDinamico $campo): JsonResponse
    {
        $campo->delete();

        return response()->json(['message' => 'Campo eliminado']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:4|unique:categorias,codigo',
            'nombre' => 'required|string|max:255',
            'es_transitoria' => 'nullable|boolean',
        ]);

        $categoria = Categoria::create([
            'codigo' => $validated['codigo'],
            'nombre' => $validated['nombre'],
            'es_transitoria' => $validated['es_transitoria'] ?? false,
        ]);

        return response()->json(['categoria' => $categoria], 201);
    }

    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'es_transitoria' => 'nullable|boolean',
        ]);

        $categoria->update($validated);

        return response()->json(['categoria' => $categoria]);
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        $categoria->delete();

        return response()->json(['message' => 'Categoría eliminada']);
    }
}