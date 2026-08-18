<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampoDinamico extends Model
{
    protected $table = 'campos_dinamicos';

    protected $fillable = ['categoria_id', 'nombre', 'tipo', 'opciones', 'requerido', 'activo', 'orden'];

    protected $casts = [
        'opciones' => 'array',
        'requerido' => 'boolean',
        'activo' => 'boolean',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }
}
