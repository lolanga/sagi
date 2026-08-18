<?php

namespace App\Http\Controllers;

use App\Models\CampoDinamico;
use App\Models\Categoria;
use App\Models\TipoItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index(): JsonResponse
    {
        $categorias = Categoria::with(['camposDinamicos', 'tiposItems'])->orderBy('codigo')->get();

        return response()->json(['categorias' => $categorias]);
    }

    public function campos(Request $request, Categoria $categoria): JsonResponse
    {
        $query = $categoria->camposDinamicos();

        if ($request->filled('tipo_item_id')) {
            $query->where('tipo_item_id', $request->integer('tipo_item_id'));
        } else {
            $query->whereNull('tipo_item_id');
        }

        return response()->json(['campos' => $query->orderBy('orden')->get()]);
    }

    public function tipos(Categoria $categoria): JsonResponse
    {
        return response()->json(['tipos' => $categoria->tiposItems]);
    }

    // ---- Elementos (tipos de ítem) ----

    public function storeTipo(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $tipo = $categoria->tiposItems()->create([
            'nombre' => $validated['nombre'],
            'orden' => $categoria->tiposItems()->count(),
        ]);

        return response()->json(['tipo' => $tipo], 201);
    }

    public function updateTipo(Request $request, TipoItem $tipo): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $tipo->update($validated);

        return response()->json(['tipo' => $tipo]);
    }

    public function destroyTipo(TipoItem $tipo): JsonResponse
    {
        $tipo->delete();

        return response()->json(['message' => 'Elemento eliminado']);
    }

    public function moverTipo(Request $request, TipoItem $tipo): JsonResponse
    {
        $direccion = $request->validate(['direccion' => 'required|in:up,down'])['direccion'];
        $this->moverEnLista(TipoItem::where('categoria_id', $tipo->categoria_id), $tipo, $direccion);

        return response()->json(['message' => 'Orden actualizado']);
    }

    // ---- Campos dinámicos ----

    public function moverCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $direccion = $request->validate(['direccion' => 'required|in:up,down'])['direccion'];
        $this->moverEnLista(CampoDinamico::where('categoria_id', $campo->categoria_id)
            ->where('tipo_item_id', $campo->tipo_item_id), $campo, $direccion);

        return response()->json(['message' => 'Orden actualizado']);
    }

    private function moverEnLista($query, $modelo, string $direccion): void
    {
        $vecinos = $query->orderBy('orden')->get();
        $indices = $vecinos->pluck('id')->flip();

        $actual = $indices[$modelo->id] ?? null;
        if ($actual === null) {
            return;
        }

        $intercambio = $direccion === 'up' ? $actual - 1 : $actual + 1;
        if ($intercambio < 0 || $intercambio >= $vecinos->count()) {
            return;
        }

        $otro = $vecinos[$intercambio];
        $tmpOrden = $modelo->orden;
        $modelo->update(['orden' => $otro->orden]);
        $otro->update(['orden' => $tmpOrden]);
    }

    public function storeCampo(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
            'requerido' => 'nullable|boolean',
            'tipo_item_id' => ['nullable', 'integer', Rule::exists('tipos_items', 'id')->where(fn ($q) => $q->where('categoria_id', $categoria->id))],
        ]);

        $campo = $categoria->camposDinamicos()->create([
            'tipo_item_id' => $validated['tipo_item_id'] ?? null,
            'nombre' => $validated['nombre'],
            'tipo' => $validated['tipo'],
            'opciones' => $validated['opciones'] ?? null,
            'placeholder' => $validated['placeholder'] ?? null,
            'requerido' => $validated['requerido'] ?? false,
            'activo' => true,
            'orden' => $categoria->camposDinamicos()
                ->where('tipo_item_id', $validated['tipo_item_id'] ?? null)
                ->count(),
        ]);

        return response()->json(['campo' => $campo], 201);
    }

    public function updateCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'tipo' => 'sometimes|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
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