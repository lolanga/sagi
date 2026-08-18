<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movimiento extends Model
{
    protected $fillable = [
        'item_id', 'tipo', 'unidad_origen_id', 'unidad_destino_id', 'motivo',
        'estado', 'solicitante_id', 'validador_id', 'fecha_validacion', 'motivo_rechazo',
    ];

    protected $casts = [
        'fecha_validacion' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function unidadOrigen()
    {
        return $this->belongsTo(Unidad::class, 'unidad_origen_id');
    }

    public function unidadDestino()
    {
        return $this->belongsTo(Unidad::class, 'unidad_destino_id');
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
