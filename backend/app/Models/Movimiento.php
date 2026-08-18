<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movimiento extends Model
{
    protected $fillable = [
        'item_id', 'tipo', 'area_origen_id', 'area_destino_id', 'motivo',
        'estado', 'solicitante_id', 'validador_id', 'fecha_validacion', 'motivo_rechazo',
    ];

    protected $casts = [
        'fecha_validacion' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function areaOrigen()
    {
        return $this->belongsTo(Area::class, 'area_origen_id');
    }

    public function areaDestino()
    {
        return $this->belongsTo(Area::class, 'area_destino_id');
    }

    public function solicitante()
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function validador()
    {
        return $this->belongsTo(User::class, 'validador_id');
    }
}
