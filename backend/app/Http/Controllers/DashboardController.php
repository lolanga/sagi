<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
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

    public function backup(): JsonResponse
    {
        $date = date('Y-m-d_H-i-s');
        $filename = "backup_sagi_{$date}.sql";
        $path = storage_path("app/backups/{$filename}");

        if (!is_dir(storage_path('app/backups'))) {
            mkdir(storage_path('app/backups'), 0755, true);
        }

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = sprintf(
            'mysqldump -h %s -P %s -u %s %s > %s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($path)
        );

        if ($password) {
            $command = sprintf(
                'mysqldump -h %s -P %s -u %s -p%s %s > %s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($path)
            );
        }

        $result = Process::run($command);

        if ($result->successful()) {
            return response()->json([
                'message' => 'Backup creado correctamente',
                'file' => $filename,
                'size' => filesize($path),
            ]);
        }

        return response()->json(['message' => 'Error al crear backup'], 500);
    }
}
