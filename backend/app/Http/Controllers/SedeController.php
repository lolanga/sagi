<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\Sede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SedeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['sedes' => Sede::with('unidades')->orderBy('nombre')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $nombre = trim((string) $request->input('nombre'));

        $validated = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('sedes', 'nombre')->where(fn ($q) => $q->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
        ], [
            'nombre.unique' => 'Ya existe una sede con ese nombre.',
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
        $nombre = trim((string) $request->input('nombre', ''));

        $validated = $request->validate([
            'nombre' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('sedes', 'nombre')->ignore($sede->id)->where(fn ($q) => $q->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
            'activa' => 'sometimes|boolean',
        ], [
            'nombre.unique' => 'Ya existe una sede con ese nombre.',
        ]);

        if (array_key_exists('nombre', $validated)) {
            $validated['nombre'] = $nombre;
        }

        $antes = [
            'nombre' => $sede->nombre,
            'activa' => $sede->activa,
        ];
        $sede->update($validated);
        $despues = [
            'nombre' => $sede->nombre,
            'activa' => $sede->activa,
        ];

        if (array_key_exists('activa', $validated)) {
            $accion = $sede->activa ? 'activar' : 'desactivar';
        } else {
            $accion = 'editar';
        }

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => $accion,
            'entidad' => 'sede',
            'entidad_id' => $sede->id,
            'detalle' => ['nombre' => $sede->nombre, 'antes' => $antes, 'despues' => $despues],
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