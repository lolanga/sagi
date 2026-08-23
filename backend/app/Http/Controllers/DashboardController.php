<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $total = Item::count();
        $activos = Item::where('estado', 'activo')->count();
        $pendientes = Movimiento::where('estado', 'pendiente')->count();
        $alertas = Alerta::where('estado', 'abierta')->count();

        $porCategoria = Categoria::withCount(['items' => fn ($q) => $q->where('estado', 'activo')])
            ->orderBy('codigo')
            ->get()
            ->map(fn ($c) => [
                'codigo' => $c->codigo,
                'nombre' => $c->nombre,
                'total' => $c->items_count,
            ]);

        return response()->json([
            'stats' => [
                'total' => $total,
                'activos' => $activos,
                'movimientos_pendientes' => $pendientes,
                'alertas_activas' => $alertas,
            ],
            'por_categoria' => $porCategoria,
        ]);
    }
}
