<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\JsonResponse;

class AreaController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['areas' => Area::orderBy('nombre')->get()]);
    }
}