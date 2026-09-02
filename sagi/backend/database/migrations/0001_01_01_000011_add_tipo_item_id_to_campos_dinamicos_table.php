<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campos_dinamicos', function (Blueprint $table) {
            $table->foreignId('tipo_item_id')->nullable()->after('categoria_id')->constrained('tipos_items')->cascadeOnDelete();
            $table->string('placeholder')->nullable()->after('opciones');
        });
    }

    public function down(): void
    {
        Schema::table('campos_dinamicos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tipo_item_id');
            $table->dropColumn('placeholder');
        });
    }
};