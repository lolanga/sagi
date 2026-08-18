<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas', function (Blueprint $table) {
            $table->id();
            $table->string('tipo'); // pendiente_aprobacion, pendiente_movimiento
            $table->string('prioridad'); // critica, importante, informativa
            $table->string('estado')->default('abierta'); // abierta, cerrada
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->foreignId('movimiento_id')->nullable()->constrained('movimientos');
            $table->foreignId('area_id')->constrained('areas');
            $table->text('mensaje');
            $table->dateTime('fecha_cierre')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas');
    }
};
