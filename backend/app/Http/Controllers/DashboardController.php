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
        $driver = DB::connection()->getDriverName();

        $host = config("database.connections.{$driver}.host");
        $port = config("database.connections.{$driver}.port");
        $database = config("database.connections.{$driver}.database");
        $username = config("database.connections.{$driver}.username");
        $password = config("database.connections.{$driver}.password");

        if ($driver === 'mysql') {
            $program = 'mysqldump';
            $command = sprintf(
                '%s -h %s -P %s -u %s --single-transaction %s',
                $program,
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database)
            );
        } elseif ($driver === 'pgsql') {
            $program = 'pg_dump';
            $command = sprintf(
                '%s -h %s -p %s -U %s --no-owner --no-acl %s',
                $program,
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database)
            );
        } else {
            return response()->json([
                'message' => "El respaldo no es compatible con el motor '{$driver}'.",
            ], 422);
        }

        $result = Process::env(['MYSQL_PWD' => (string) $password, 'PGPASSWORD' => (string) $password])
            ->run($command);

        if ($result->successful()) {
            $date = date('Y-m-d_H-i-s');
            $filename = "backup_sagi_{$date}.sql";

            Auditoria::create([
                'user_id' => request()->user()->id,
                'accion' => 'backup',
                'entidad' => 'sistema',
                'entidad_id' => null,
                'detalle' => ['archivo' => $filename, 'motor' => $driver],
            ]);

            return response($result->output(), 200, [
                'Content-Type' => 'application/sql',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        return response()->json(['message' => 'Error al crear backup: ' . $result->errorOutput()], 500);
    }
}
