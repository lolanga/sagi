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
        $sedeId = $request->integer('sede_id');
        $nombre = trim((string) $request->input('nombre'));

        $validated = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('unidades', 'nombre')->where(fn ($q) => $q
                    ->where('sede_id', $sedeId)
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])),
            ],
            'sede_id' => ['required', 'integer', Rule::exists('sedes', 'id')],
        ], [
            'nombre.unique' => 'Ya existe una unidad con ese nombre en la sede seleccionada.',
        ]);

        $unidad = Unidad::create([
            'nombre' => $nombre,
            'sede_id' => $validated['sede_id'],
        ]);

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => 'crear',
            'entidad' => 'unidad',
            'entidad_id' => $unidad->id,
            'detalle' => ['nombre' => $unidad->nombre, 'sede' => $unidad->sede->nombre ?? '-'],
        ]);

        return response()->json(['unidad' => $unidad->load('sede')], 201);
    }

    public function update(Request $request, Unidad $unidad): JsonResponse
    {
        $cambiaNombre = $request->has('nombre');
        $cambiaSede = $request->has('sede_id');

        $rules = [
            'sede_id' => ['sometimes', 'integer', Rule::exists('sedes', 'id')],
            'activa' => 'sometimes|boolean',
        ];

        if ($cambiaNombre || $cambiaSede) {
            $nombreFinal = $cambiaNombre ? trim((string) $request->input('nombre')) : $unidad->nombre;
            $sedeFinal = $cambiaSede ? $request->integer('sede_id') : $unidad->sede_id;

            $rules['nombre'] = [
                'sometimes', 'string', 'max:255',
                Rule::unique('unidades', 'nombre')->ignore($unidad->id)->where(fn ($q) => $q
                    ->where('sede_id', $sedeFinal)
                    ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombreFinal)])),
            ];
        }

        $validated = $request->validate($rules, [
            'nombre.unique' => 'Ya existe una unidad con ese nombre en la sede seleccionada.',
        ]);

        if (array_key_exists('nombre', $validated)) {
            $validated['nombre'] = trim((string) $request->input('nombre'));
        }

        $antes = [
            'nombre' => $unidad->nombre,
            'activa' => $unidad->activa,
            'sede' => $unidad->sede?->nombre,
        ];
        $unidad->update($validated);
        $despues = [
            'nombre' => $unidad->nombre,
            'activa' => $unidad->activa,
            'sede' => $unidad->sede?->nombre,
        ];

        if (array_key_exists('activa', $validated)) {
            $accion = $unidad->activa ? 'activar' : 'desactivar';
        } else {
            $accion = 'editar';
        }

        Auditoria::create([
            'user_id' => $request->user()->id,
            'accion' => $accion,
            'entidad' => 'unidad',
            'entidad_id' => $unidad->id,
            'detalle' => ['antes' => $antes, 'despues' => $despues],
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