<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Item::with(['categoria', 'responsable', 'area'])
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json($items);
    }
}