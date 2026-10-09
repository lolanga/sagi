<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cada lote de la carga masiva deja un registro. La clave unica
        // (import_uuid, lote) es lo que hace idempotente la operacion: si el
        // mismo lote llega dos veces (reintento de red, doble clic), el
        // segundo intento lo encuentra y no vuelve a insertar nada.
        Schema::create('importaciones', function (Blueprint $table) {
            $table->id();
            $table->uuid('import_uuid');
            $table->unsignedInteger('lote');
            $table->unsignedInteger('filas')->default(0);
            $table->unsignedInteger('insertados')->default(0);
            $table->unsignedInteger('fallidas')->default(0);
            // en_progreso => se creo pero no termino (request cortado a la mitad)
            $table->string('estado', 20)->default('en_progreso');
            $table->json('resultado')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();

            $table->unique(['import_uuid', 'lote']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('importaciones');
    }
};
