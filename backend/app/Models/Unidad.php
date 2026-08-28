<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unidad extends Model
{
    protected $table = 'unidades';

    protected $fillable = ['sede_id', 'nombre', 'activa'];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function sede()
    {
        return $this->belongsTo(Sede::class);
    }
}