<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->text('motivo_baja')->nullable()->after('estado');
            $table->timestamp('fecha_baja')->nullable()->after('motivo_baja');
            $table->foreignId('categoria_original_id')->nullable()->after('fecha_baja')->constrained('categorias')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['categoria_original_id']);
            $table->dropColumn(['motivo_baja', 'fecha_baja', 'categoria_original_id']);
        });
    }
};
