<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // items.categoria_id pasaba a guardar siempre A7 (Altas) / A8 (Bajas),
        // que son categorias de ciclo de vida y no de clasificacion.
        // La categoria real se recupera del elemento (tipo_item), que siempre
        // pertenece a una categoria A1-A6.
        DB::statement(
            'UPDATE items
             SET categoria_id = (
                 SELECT t.categoria_id FROM tipos_items t WHERE t.id = items.tipo_item_id
             )
             WHERE tipo_item_id IS NOT NULL'
        );

        // Respaldo para items sin elemento: la categoria esta en el prefijo del
        // codigo unico ({A5}-{sede}-{unidad}-{n}).
        DB::table('items')
            ->whereNull('tipo_item_id')
            ->orderBy('id')
            ->chunkById(200, function ($items) {
                foreach ($items as $item) {
                    $codigo = explode('-', (string) $item->codigo_unico)[0];
                    $categoriaId = DB::table('categorias')
                        ->where('codigo', $codigo)
                        ->value('id');

                    if ($categoriaId) {
                        DB::table('items')
                            ->where('id', $item->id)
                            ->update(['categoria_id' => $categoriaId]);
                    }
                }
            });
    }

    public function down(): void
    {
        // Revierte al comportamiento anterior: los activos a A7 y los de baja a A8.
        $a7 = DB::table('categorias')->where('codigo', 'A7')->value('id');
        $a8 = DB::table('categorias')->where('codigo', 'A8')->value('id');

        if (!$a7 || !$a8) {
            return;
        }

        DB::table('items')->where('estado', 'baja')->update(['categoria_id' => $a8]);
        DB::table('items')->where('estado', '!=', 'baja')->update(['categoria_id' => $a7]);
    }
};
