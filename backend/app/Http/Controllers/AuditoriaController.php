<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Auditoria::with('user')->orderByDesc('created_at');

        if ($request->filled('entidad')) {
            $query->where('entidad', $request->string('entidad'));
        }

        if ($request->filled('accion')) {
            $query->where('accion', $request->string('accion'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('desde')) {
            $query->whereDate('created_at', '>=', $request->string('desde'));
        }

        if ($request->filled('hasta')) {
            $query->whereDate('created_at', '<=', $request->string('hasta'));
        }

        return response()->json($query->paginate(50)->withQueryString());
    }
}