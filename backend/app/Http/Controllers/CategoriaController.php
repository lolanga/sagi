<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\CampoDinamico;
use App\Models\Categoria;
use App\Models\TipoItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    private function log(Request $request, string $accion, string $entidad, int|string $entidadId, array $detalle): void
    {
        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => $accion,
            'entidad' => $entidad,
            'entidad_id' => $entidadId,
            'detalle' => $detalle,
        ]);
    }
    public function index(): JsonResponse
    {
        $categorias = Categoria::with(['camposDinamicos', 'tiposItems' => function ($q) {
            $q->withCount('items');
        }])->orderBy('codigo')->get();

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
        $nombre = trim((string) $request->input('nombre'));

        $validated = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('tipos_items', 'nombre')->where(fn ($q) => $q
                    ->where('categoria_id', $categoria->id)
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
        ], [
            'nombre.unique' => 'Ya existe un elemento con ese nombre en esta categoría.',
        ]);

        $tipo = $categoria->tiposItems()->create([
            'nombre' => $nombre,
            'orden' => $categoria->tiposItems()->count(),
        ]);

        $this->log($request, 'crear', 'tipo_item', $tipo->id, [
            'categoria' => $categoria->codigo,
            'nombre' => $tipo->nombre,
        ]);

        return response()->json(['tipo' => $tipo], 201);
    }

    public function updateTipo(Request $request, TipoItem $tipo): JsonResponse
    {
        $nombre = trim((string) $request->input('nombre'));

        $validated = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('tipos_items', 'nombre')->ignore($tipo->id)->where(fn ($q) => $q
                    ->where('categoria_id', $tipo->categoria_id)
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
        ], [
            'nombre.unique' => 'Ya existe un elemento con ese nombre en esta categoría.',
        ]);

        $validated['nombre'] = $nombre;
        $antes = $tipo->nombre;
        $tipo->update($validated);

        $this->log($request, 'editar', 'tipo_item', $tipo->id, [
            'categoria' => $tipo->categoria->codigo ?? '-',
            'antes' => $antes,
            'despues' => $tipo->nombre,
        ]);

        return response()->json(['tipo' => $tipo]);
    }

    public function destroyTipo(Request $request, TipoItem $tipo): JsonResponse
    {
        $itemsAsociados = \App\Models\Item::where('tipo_item_id', $tipo->id)->count();
        if ($itemsAsociados > 0) {
            return response()->json([
                'message' => "No se puede eliminar: el elemento \"{$tipo->nombre}\" tiene {$itemsAsociados} ítem(s) asociado(s)."
            ], 422);
        }

        $detalle = ['categoria' => $tipo->categoria->codigo ?? '-', 'nombre' => $tipo->nombre];
        $tipo->delete();

        $this->log($request, 'eliminar', 'tipo_item', $tipo->id, $detalle);

        return response()->json(['message' => 'Elemento eliminado']);
    }

    public function moverTipo(Request $request, TipoItem $tipo): JsonResponse
    {
        $direccion = $request->validate(['direccion' => 'required|in:up,down'])['direccion'];
        $this->moverEnLista(TipoItem::where('categoria_id', $tipo->categoria_id), $tipo, $direccion);

        $this->log($request, 'mover', 'tipo_item', $tipo->id, [
            'categoria' => $tipo->categoria->codigo ?? '-',
            'nombre' => $tipo->nombre,
            'direccion' => $direccion,
        ]);

        return response()->json(['message' => 'Orden actualizado']);
    }

    // ---- Campos dinámicos ----

    public function moverCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $direccion = $request->validate(['direccion' => 'required|in:up,down'])['direccion'];
        $this->moverEnLista(CampoDinamico::where('categoria_id', $campo->categoria_id)
            ->where('tipo_item_id', $campo->tipo_item_id), $campo, $direccion);

        $this->log($request, 'mover', 'campo_dinamico', $campo->id, [
            'categoria' => $campo->categoria->codigo ?? '-',
            'tipo_item' => $campo->tipoItem->nombre ?? 'General',
            'nombre' => $campo->nombre,
            'direccion' => $direccion,
        ]);

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

        $ids = $vecinos->pluck('id')->all();
        [$ids[$actual], $ids[$intercambio]] = [$ids[$intercambio], $ids[$actual]];

        $modelClass = get_class($modelo);
        foreach ($ids as $i => $id) {
            $modelClass::whereKey($id)->update(['orden' => $i]);
        }
    }

    public function storeCampo(Request $request, Categoria $categoria): JsonResponse
    {
        $nombre = trim((string) $request->input('nombre'));
        $tipoItemId = $request->filled('tipo_item_id') ? $request->integer('tipo_item_id') : null;

        $validated = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('campos_dinamicos', 'nombre')->where(fn ($q) => $q
                    ->where('categoria_id', $categoria->id)
                    ->when(is_null($tipoItemId),
                        fn ($qq) => $qq->whereNull('tipo_item_id'),
                        fn ($qq) => $qq->where('tipo_item_id', $tipoItemId))
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
            'tipo' => 'required|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
            'requerido' => 'nullable|boolean',
            'tipo_item_id' => ['nullable', 'integer', Rule::exists('tipos_items', 'id')->where(fn ($q) => $q->where('categoria_id', $categoria->id))],
        ], [
            'nombre.unique' => 'Ya existe un campo con ese nombre en este ámbito.',
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
                ->max('orden') + 1,
        ]);

        $this->log($request, 'crear', 'campo_dinamico', $campo->id, [
            'categoria' => $categoria->codigo,
            'tipo_item' => $campo->tipoItem->nombre ?? 'General',
            'nombre' => $campo->nombre,
            'tipo' => $campo->tipo,
        ]);

        return response()->json(['campo' => $campo], 201);
    }

    public function updateCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $nombre = trim((string) $request->input('nombre', ''));

        $validated = $request->validate([
            'nombre' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('campos_dinamicos', 'nombre')->ignore($campo->id)->where(fn ($q) => $q
                    ->where('categoria_id', $campo->categoria_id)
                    ->when(is_null($campo->tipo_item_id),
                        fn ($qq) => $qq->whereNull('tipo_item_id'),
                        fn ($qq) => $qq->where('tipo_item_id', $campo->tipo_item_id))
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
            'tipo' => 'sometimes|in:texto,numero,fecha,select,textarea',
            'opciones' => 'nullable|array',
            'placeholder' => 'nullable|string|max:255',
            'requerido' => 'nullable|boolean',
            'activo' => 'nullable|boolean',
            'orden' => 'nullable|integer',
        ], [
            'nombre.unique' => 'Ya existe un campo con ese nombre en este ámbito.',
        ]);

        if (array_key_exists('nombre', $validated)) {
            $validated['nombre'] = $nombre;
        }

        $antes = $campo->only(['nombre', 'tipo', 'opciones', 'placeholder', 'requerido', 'activo']);
        $campo->update($validated);

        $this->log($request, 'editar', 'campo_dinamico', $campo->id, [
            'categoria' => $campo->categoria->codigo ?? '-',
            'tipo_item' => $campo->tipoItem->nombre ?? 'General',
            'antes' => $antes,
            'despues' => $campo->only(['nombre', 'tipo', 'opciones', 'placeholder', 'requerido', 'activo']),
        ]);

        return response()->json(['campo' => $campo]);
    }

    public function destroyCampo(Request $request, CampoDinamico $campo): JsonResponse
    {
        $detalle = [
            'categoria' => $campo->categoria->codigo ?? '-',
            'tipo_item' => $campo->tipoItem->nombre ?? 'General',
            'nombre' => $campo->nombre,
        ];
        $campo->delete();

        $this->log($request, 'eliminar', 'campo_dinamico', $campo->id, $detalle);

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

        $this->log($request, 'crear', 'categoria', $categoria->id, [
            'codigo' => $categoria->codigo,
            'nombre' => $categoria->nombre,
        ]);

        return response()->json(['categoria' => $categoria], 201);
    }

    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'es_transitoria' => 'nullable|boolean',
        ]);

        $antes = $categoria->only(['nombre', 'es_transitoria']);
        $categoria->update($validated);

        $this->log($request, 'editar', 'categoria', $categoria->id, [
            'codigo' => $categoria->codigo,
            'antes' => $antes,
            'despues' => $categoria->only(['nombre', 'es_transitoria']),
        ]);

        return response()->json(['categoria' => $categoria]);
    }

    public function destroy(Request $request, Categoria $categoria): JsonResponse
    {
        $detalle = ['codigo' => $categoria->codigo, 'nombre' => $categoria->nombre];
        $categoria->delete();

        $this->log($request, 'eliminar', 'categoria', $categoria->id, $detalle);

        return response()->json(['message' => 'Categoría eliminada']);
    }
}