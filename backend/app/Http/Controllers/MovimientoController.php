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
            'unidad_id' => $item->unidad_id,
            'mensaje' => sprintf(
                '%s pendiente de aprobación para el ítem %s (%s)',
                $m->tipo === 'traslado' ? 'Traslado' : 'Baja',
                $item->codigo_unico,
                $item->tipoItem?->nombre ?? 'sin elemento'
            ),
        ]);
    }

    private function cerrarAlertas(Movimiento $m, int $userId): void
    {
        $alertas = Alerta::where('movimiento_id', $m->id)
            ->where('estado', 'abierta')
            ->get();

        foreach ($alertas as $alerta) {
            $alerta->update(['estado' => 'cerrada', 'fecha_cierre' => now()]);

            Auditoria::create([
                'user_id' => $userId,
                'accion' => 'cerrar',
                'entidad' => 'alerta',
                'entidad_id' => $alerta->id,
                'detalle' => [
                    'item' => $m->item?->codigo_unico ?? '-',
                    'motivo' => 'Aprobación/rechazo del movimiento #' . $m->id,
                ],
            ]);
        }
    }
    public function index(Request $request): JsonResponse
    {
        $query = Movimiento::with([
            'item.categoria',
            'item.tipoItem',
            'unidadOrigen',
            'unidadDestino',
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
            'unidad_destino_id' => ['required', 'integer', Rule::exists('unidades', 'id')],
            'motivo' => 'required|string',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $user = $request->user();

        if ((int) $validated['unidad_destino_id'] === (int) $item->unidad_id) {
            return response()->json(['message' => 'El área de destino es la misma que el área actual del ítem'], 422);
        }

        try {
            $movimiento = DB::transaction(function () use ($item, $validated, $user) {
                $m = Movimiento::create([
                    'item_id' => $item->id,
                    'tipo' => 'traslado',
                    'unidad_origen_id' => $item->unidad_id,
                    'unidad_destino_id' => $validated['unidad_destino_id'],
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
                        'unidad_origen' => $item->unidad->nombre ?? '-',
                        'unidad_destino' => \App\Models\Unidad::find($validated['unidad_destino_id'])?->nombre ?? '-',
                        'motivo' => $validated['motivo'],
                    ],
                ]);

                $this->crearAlerta($m, $item);

                return $m;
            });

            $movimiento->load(['item.categoria', 'item.tipoItem', 'unidadOrigen', 'unidadDestino', 'solicitante', 'validador']);

            return response()->json(['movimiento' => $movimiento], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al crear el traslado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeBaja(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', Rule::exists('items', 'id')->where(fn ($q) => $q->where('estado', 'activo'))],
            'motivo' => 'required|string',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $user = $request->user();

        try {
            $movimiento = DB::transaction(function () use ($item, $validated, $user) {
                $m = Movimiento::create([
                    'item_id' => $item->id,
                    'tipo' => 'baja',
                    'unidad_origen_id' => $item->unidad_id,
                    'unidad_destino_id' => null,
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
                        'unidad_origen' => $item->unidad->nombre ?? '-',
                        'motivo' => $validated['motivo'],
                    ],
                ]);

                $this->crearAlerta($m, $item);

                return $m;
            });

            $movimiento->load(['item.categoria', 'item.tipoItem', 'unidadOrigen', 'unidadDestino', 'solicitante', 'validador']);

            return response()->json(['movimiento' => $movimiento], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al crear la solicitud de baja',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function aprobar(Request $request, Movimiento $movimiento): JsonResponse
    {
        if ($movimiento->estado !== 'pendiente') {
            return response()->json(['message' => 'El movimiento ya fue procesado'], 422);
        }

        $user = $request->user();
        $item = $movimiento->item;

        if (!$item) {
            return response()->json(['message' => 'El ítem asociado ya no existe'], 422);
        }

        try {
            DB::transaction(function () use ($movimiento, $item, $user) {
                if ($movimiento->tipo === 'traslado') {
                    $item->update(['unidad_id' => $movimiento->unidad_destino_id]);
                }

                if ($movimiento->tipo === 'baja') {
                    $item->update([
                        'estado' => 'baja',
                        'categoria_original_id' => $item->categoria_id,
                        'categoria_id' => Categoria::where('codigo', 'A8')->value('id') ?? $item->categoria_id,
                        'motivo_baja' => $movimiento->motivo,
                        'fecha_baja' => now(),
                    ]);
                }

                $movimiento->update([
                    'estado' => 'aprobado',
                    'validador_id' => $user->id,
                    'fecha_validacion' => now(),
                ]);

                $this->cerrarAlertas($movimiento, $user->id);

                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'aprobar',
                    'entidad' => 'movimiento',
                    'entidad_id' => $movimiento->id,
                    'detalle' => array_merge([
                        'tipo' => $movimiento->tipo,
                        'item' => $item->codigo_unico,
                    ], $movimiento->tipo === 'traslado' ? [
                        'unidad_origen' => $item->getOriginal('unidad_id') ? \App\Models\Unidad::find($item->getOriginal('unidad_id'))?->nombre ?? '-' : '-',
                        'unidad_destino' => $item->unidad->nombre ?? '-',
                    ] : [
                        'estado_anterior' => 'activo',
                        'estado_nuevo' => $item->estado,
                        'categoria_anterior' => $item->getOriginal('categoria_id') ? \App\Models\Categoria::find($item->getOriginal('categoria_id'))?->codigo ?? '-' : '-',
                        'categoria_nueva' => $item->categoria->codigo ?? '-',
                        'motivo_baja' => $movimiento->motivo,
                    ]),
                ]);
            });

            $movimiento->load(['item.categoria', 'item.tipoItem', 'unidadOrigen', 'unidadDestino', 'solicitante', 'validador']);

            return response()->json(['movimiento' => $movimiento]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al aprobar el movimiento',
                'error' => $e->getMessage(),
            ], 500);
        }
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

        try {
            $movimiento = DB::transaction(function () use ($movimiento, $user, $validated) {
                $movimiento->update([
                    'estado' => 'rechazado',
                    'validador_id' => $user->id,
                    'fecha_validacion' => now(),
                    'motivo_rechazo' => $validated['motivo_rechazo'],
                ]);

                $this->cerrarAlertas($movimiento, $user->id);

                Auditoria::create([
                    'user_id' => $user->id,
                    'accion' => 'rechazar',
                    'entidad' => 'movimiento',
                    'entidad_id' => $movimiento->id,
                    'detalle' => [
                        'tipo' => $movimiento->tipo,
                        'item' => $movimiento->item?->codigo_unico ?? '-',
                        'motivo_rechazo' => $validated['motivo_rechazo'],
                    ],
                ]);

                return $movimiento;
            });

            $movimiento->load(['item.categoria', 'item.tipoItem', 'unidadOrigen', 'unidadDestino', 'solicitante', 'validador']);

            return response()->json(['movimiento' => $movimiento]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al rechazar el movimiento',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}