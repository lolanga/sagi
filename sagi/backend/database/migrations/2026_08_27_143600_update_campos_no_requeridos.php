<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hacer NO requeridos: Medidas, Características, Capacidad (todas las variantes), Número de serie
        DB::table('campos_dinamicos')
            ->whereIn('nombre', [
                'Medidas',
                'Características',
                'Capacidad (BTU)',
                'Capacidad (RPM)',
                'Capacidad (W)',
                'Capacidad (L)',
                'Capacidad (VA)',
                'Número de serie',
            ])
            ->update(['requerido' => false]);
    }

    public function down(): void
    {
        DB::table('campos_dinamicos')
            ->whereIn('nombre', [
                'Medidas',
                'Características',
                'Capacidad (BTU)',
                'Capacidad (RPM)',
                'Capacidad (W)',
                'Capacidad (L)',
                'Capacidad (VA)',
                'Número de serie',
            ])
            ->update(['requerido' => true]);
    }
};
