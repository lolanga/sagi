<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampoDinamico extends Model
{
    protected $table = 'campos_dinamicos';

    protected $fillable = ['categoria_id', 'tipo_item_id', 'nombre', 'tipo', 'opciones', 'placeholder', 'requerido', 'activo', 'orden'];

    protected $casts = [
        'opciones' => 'array',
        'requerido' => 'boolean',
        'activo' => 'boolean',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function tipoItem()
    {
        return $this->belongsTo(TipoItem::class, 'tipo_item_id');
    }
}
