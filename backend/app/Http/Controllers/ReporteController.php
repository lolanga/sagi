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

        $porArea = Item::select('area_id', 'areas.nombre', DB::raw('COUNT(*) as total'))
            ->join('areas', 'areas.id', '=', 'items.area_id')
            ->where('items.estado', 'activo')
            ->groupBy('items.area_id', 'areas.nombre')
            ->orderBy('areas.nombre')
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
            'por_area' => $porArea,
            'por_elemento' => $porElemento,
            'movimientos_mes' => $movimientosMes,
        ]);
    }

    public function items(Request $request): JsonResponse
    {
        $query = Item::with(['categoria', 'tipoItem', 'responsable', 'area'])->orderBy('codigo_unico');

        if ($request->filled('estado')) {
            $query->where('estado', $request->string('estado'));
        }

        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->integer('categoria_id'));
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->integer('area_id'));
        }

        return response()->json($query->get());
    }
}