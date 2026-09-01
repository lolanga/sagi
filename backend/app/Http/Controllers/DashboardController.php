<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
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

    public function backup(): \Symfony\Component\HttpFoundation\Response
    {
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = sprintf(
            'mysqldump -h %s -P %s -u %s %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database)
        );

        if ($password) {
            $command .= ' -p' . escapeshellarg($password);
        }

        $result = \Illuminate\Support\Facades\Process::run($command);

        if ($result->successful()) {
            $date = date('Y-m-d_H-i-s');
            $filename = "backup_sagi_{$date}.sql";

            Auditoria::create([
                'user_id' => request()->user()->id,
                'accion' => 'backup',
                'entidad' => 'sistema',
                'entidad_id' => null,
                'detalle' => ['archivo' => $filename],
            ]);

            return response($result->output(), 200, [
                'Content-Type' => 'application/sql',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        return response()->json(['message' => 'Error al crear backup: ' . $result->errorOutput()], 500);
    }
}
