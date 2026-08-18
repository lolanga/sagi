<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_unico', 20)->unique();
            $table->foreignId('categoria_id')->constrained('categorias');
            $table->foreignId('responsable_id')->constrained('users');
            $table->foreignId('area_id')->constrained('areas');
            $table->string('estado_conservacion')->default('Muy bueno'); // Muy bueno, Bueno, Regular, Malo
            $table->integer('cantidad')->default(1);
            $table->date('fecha_alta');
            $table->json('valores_dinamicos')->nullable();
            $table->string('estado')->default('activo'); // activo, pendiente, baja
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
