<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $fillable = ['codigo', 'nombre', 'es_transitoria'];

    protected $casts = [
        'es_transitoria' => 'boolean',
    ];

    public function camposDinamicos()
    {
        return $this->hasMany(CampoDinamico::class)->orderBy('orden');
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
