<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Inventario
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store'])->middleware('rol:admin,jefe,carga');
    Route::get('/items/{item}', [ItemController::class, 'show']);
    Route::put('/items/{item}', [ItemController::class, 'update'])->middleware('rol:admin,jefe,carga');

    // Categorías, campos dinámicos y elementos
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::get('/categorias/{categoria}/campos', [CategoriaController::class, 'campos']);
    Route::get('/categorias/{categoria}/tipos', [CategoriaController::class, 'tipos']);
    Route::post('/categorias/{categoria}/campos', [CategoriaController::class, 'storeCampo'])->middleware('rol:admin');
    Route::put('/campos-dinamicos/{campo}', [CategoriaController::class, 'updateCampo'])->middleware('rol:admin');
    Route::delete('/campos-dinamicos/{campo}', [CategoriaController::class, 'destroyCampo'])->middleware('rol:admin');
    Route::post('/campos-dinamicos/{campo}/mover', [CategoriaController::class, 'moverCampo'])->middleware('rol:admin');
    Route::post('/categorias/{categoria}/tipos', [CategoriaController::class, 'storeTipo'])->middleware('rol:admin');
    Route::put('/tipos-item/{tipo}', [CategoriaController::class, 'updateTipo'])->middleware('rol:admin');
    Route::delete('/tipos-item/{tipo}', [CategoriaController::class, 'destroyTipo'])->middleware('rol:admin');
    Route::post('/tipos-item/{tipo}/mover', [CategoriaController::class, 'moverTipo'])->middleware('rol:admin');
    Route::post('/categorias', [CategoriaController::class, 'store'])->middleware('rol:admin');
    Route::put('/categorias/{categoria}', [CategoriaController::class, 'update'])->middleware('rol:admin');
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->middleware('rol:admin');
});