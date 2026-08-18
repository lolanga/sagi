<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('tipo'); // alta, traslado, baja
            $table->foreignId('area_origen_id')->constrained('areas');
            $table->foreignId('area_destino_id')->nullable()->constrained('areas');
            $table->text('motivo');
            $table->string('estado')->default('pendiente'); // pendiente, aprobado, rechazado
            $table->foreignId('solicitante_id')->constrained('users');
            $table->foreignId('validador_id')->nullable()->constrained('users');
            $table->dateTime('fecha_validacion')->nullable();
            $table->text('motivo_rechazo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
