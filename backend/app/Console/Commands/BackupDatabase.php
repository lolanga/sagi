<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup';
    protected $description = 'Crear backup de la base de datos';

    public function handle()
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
            $this->info("Backup creado: {$path}");
            $this->info("Tamaño: " . number_format(filesize($path) / 1024, 2) . " KB");
            return 0;
        }

        $this->error("Error al crear backup: {$result->errorOutput()}");
        return 1;
    }
}
