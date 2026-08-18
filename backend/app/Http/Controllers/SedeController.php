<?php

namespace App\Http\Controllers;

use App\Models\Sede;
use Illuminate\Http\JsonResponse;

class SedeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['sedes' => Sede::with('unidades')->orderBy('nombre')->get()]);
    }
}