<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    public function resumen(Request $request): JsonResponse
    {
        $user = $request->user();

        $porCategoria = Categoria::withCount(['items' => fn ($q) => $q->where('estado', 'activo')])
            ->orderBy('codigo')
            ->get()
            ->map(fn ($c) => [
                'codigo' => $c->codigo,
                'nombre' => $c->nombre,
                'total' => $c->items_count,
            ]);

        $porEstadoConservacion = Item::select('estado_conservacion', DB::raw('COUNT(*) as total'))
            ->groupBy('estado_conservacion')
            ->orderBy('estado_conservacion')
            ->get();

        $porSede = Item::select('unidades.sede_id', 'sedes.nombre', DB::raw('COUNT(*) as total'))
            ->join('unidades', 'unidades.id', '=', 'items.unidad_id')
            ->join('sedes', 'sedes.id', '=', 'unidades.sede_id')
            ->where('items.estado', 'activo')
            ->groupBy('unidades.sede_id', 'sedes.nombre')
            ->orderBy('sedes.nombre')
            ->get();

        $porUnidad = Item::select('items.unidad_id', 'unidades.nombre', 'sedes.nombre as sede_nombre', DB::raw('COUNT(*) as total'))
            ->join('unidades', 'unidades.id', '=', 'items.unidad_id')
            ->join('sedes', 'sedes.id', '=', 'unidades.sede_id')
            ->where('items.estado', 'activo')
            ->groupBy('items.unidad_id', 'unidades.nombre', 'sedes.nombre')
            ->orderBy('unidades.nombre')
            ->get();

        $porElemento = Item::select('tipo_item_id', 'tipos_items.nombre', DB::raw('COUNT(*) as total'))
            ->join('tipos_items', 'tipos_items.id', '=', 'items.tipo_item_id')
            ->where('items.estado', 'activo')
            ->groupBy('items.tipo_item_id', 'tipos_items.nombre')
            ->orderByDesc('total')
            ->limit(20)
            ->get();

        $movimientosMes = Movimiento::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as mes"),
            'tipo',
            DB::raw('COUNT(*) as total')
        )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"), 'tipo')
            ->orderBy('mes')
            ->get();

        return response()->json([
            'por_categoria' => $porCategoria,
            'por_estado_conservacion' => $porEstadoConservacion,
            'por_sede' => $porSede,
            'por_unidad' => $porUnidad,
            'por_elemento' => $porElemento,
            'movimientos_mes' => $movimientosMes,
        ]);
    }

    public function items(Request $request): JsonResponse
    {
        $query = Item::with(['categoria', 'tipoItem', 'responsable', 'unidad'])->orderBy('codigo_unico');

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('unidad_id')) {
            $query->where('unidad_id', $request->integer('unidad_id'));
        }

        return response()->json($query->get());
    }
}