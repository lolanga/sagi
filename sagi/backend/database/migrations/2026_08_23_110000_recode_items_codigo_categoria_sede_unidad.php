<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $codigosCategoria = DB::table('categorias')->pluck('codigo', 'id');
        $sedesDeUnidad = DB::table('unidades')->pluck('sede_id', 'id');

        $contadores = [];
        $items = DB::table('items')->orderBy('id')->get(['id', 'categoria_id', 'unidad_id']);

        foreach ($items as $item) {
            $codigoCat = $codigosCategoria[$item->categoria_id] ?? 'XX';
            $sedeId = $sedesDeUnidad[$item->unidad_id] ?? 0;

            $prefijo = sprintf('%s-%02d-%02d-', $codigoCat, $sedeId, $item->unidad_id);
            $contadores[$prefijo] = ($contadores[$prefijo] ?? 0) + 1;

            DB::table('items')
                ->where('id', $item->id)
                ->update(['codigo_unico' => $prefijo.str_pad((string) $contadores[$prefijo], 6, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        // No se restaura el formato anterior
    }
};
