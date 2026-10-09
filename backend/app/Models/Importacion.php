<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Importacion extends Model
{
    // Str::plural da "importacions"; la tabla es "importaciones".
    protected $table = 'importaciones';

    protected $fillable = [
        'import_uuid',
        'lote',
        'filas',
        'insertados',
        'fallidas',
        'estado',
        'resultado',
        'user_id',
    ];

    protected $casts = [
        'resultado' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
