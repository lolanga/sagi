<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'codigo_unico', 'categoria_id', 'responsable_id', 'area_id',
        'estado_conservacion', 'cantidad', 'fecha_alta', 'valores_dinamicos', 'estado',
    ];

    protected $casts = [
        'valores_dinamicos' => 'array',
        'fecha_alta' => 'date',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function responsable()
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function movimientos()
    {
        return $this->hasMany(Movimiento::class)->orderByDesc('created_at');
    }
}
