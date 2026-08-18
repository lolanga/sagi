<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sede extends Model
{
    protected $fillable = ['nombre'];

    public function unidades()
    {
        return $this->hasMany(Unidad::class);
    }
}