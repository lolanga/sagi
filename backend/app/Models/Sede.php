<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sede extends Model
{
    protected $fillable = ['nombre', 'activa'];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function unidades()
    {
        return $this->hasMany(Unidad::class);
    }
}