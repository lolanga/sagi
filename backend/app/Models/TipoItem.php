<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoItem extends Model
{
    protected $table = 'tipos_items';

    protected $fillable = ['categoria_id', 'nombre', 'orden'];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function campos()
    {
        return $this->hasMany(CampoDinamico::class)->orderBy('orden');
    }
}