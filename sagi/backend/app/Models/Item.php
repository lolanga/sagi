<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'codigo_unico', 'categoria_id', 'tipo_item_id', 'responsable_id', 'unidad_id',
        'estado_conservacion', 'cantidad', 'fecha_alta', 'valores_dinamicos', 'estado',
        'motivo_baja', 'fecha_baja', 'categoria_original_id',
    ];

    protected $casts = [
        'valores_dinamicos' => 'array',
        'fecha_alta' => 'date',
        'fecha_baja' => 'datetime',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function categoriaOriginal()
    {
        return $this->belongsTo(Categoria::class, 'categoria_original_id');
    }

    public function tipoItem()
    {
        return $this->belongsTo(TipoItem::class, 'tipo_item_id');
    }

    public function responsable()
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function unidad()
    {
        return $this->belongsTo(Unidad::class);
    }

    public function movimientos()
    {
        return $this->hasMany(Movimiento::class)->orderByDesc('created_at');
    }
}
