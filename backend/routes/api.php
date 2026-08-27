<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AlertaController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\SedeController;
use App\Http\Controllers\UnidadController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::post('/dashboard/backup', [DashboardController::class, 'backup'])->middleware('rol:admin');

    // Auditoría
    Route::get('/auditoria', [AuditoriaController::class, 'index'])->middleware('rol:admin,jefe');

    // Sedes y Unidades de destino
    Route::get('/sedes', [SedeController::class, 'index']);
    Route::post('/sedes', [SedeController::class, 'store'])->middleware('rol:admin');
    Route::put('/sedes/{sede}', [SedeController::class, 'update'])->middleware('rol:admin');
    Route::delete('/sedes/{sede}', [SedeController::class, 'destroy'])->middleware('rol:admin');
    Route::get('/unidades', [UnidadController::class, 'index']);
    Route::post('/unidades', [UnidadController::class, 'store'])->middleware('rol:admin');
    Route::put('/unidades/{unidad}', [UnidadController::class, 'update'])->middleware('rol:admin');
    Route::delete('/unidades/{unidad}', [UnidadController::class, 'destroy'])->middleware('rol:admin');

    // Alertas
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas', [AlertaController::class, 'store'])->middleware('rol:admin,jefe');
    Route::post('/alertas/{alerta}/cerrar', [AlertaController::class, 'cerrar'])->middleware('rol:admin,jefe');

    // Movimientos (Fase 3: traslados y bajas)
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos/traslados', [MovimientoController::class, 'storeTraslado'])->middleware('rol:admin,jefe,carga');
    Route::post('/movimientos/bajas', [MovimientoController::class, 'storeBaja'])->middleware('rol:admin,jefe,carga');
    Route::post('/movimientos/{movimiento}/aprobar', [MovimientoController::class, 'aprobar'])->middleware('rol:admin,jefe');
    Route::post('/movimientos/{movimiento}/rechazar', [MovimientoController::class, 'rechazar'])->middleware('rol:admin,jefe');

    // Reportes
    Route::get('/reportes/resumen', [ReporteController::class, 'resumen'])->middleware('rol:admin,jefe');
    Route::get('/reportes/items', [ReporteController::class, 'items'])->middleware('rol:admin,jefe');

    // Inventario
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store'])->middleware('rol:admin,jefe,carga');
    Route::get('/items/{item}', [ItemController::class, 'show']);
    Route::put('/items/{item}', [ItemController::class, 'update'])->middleware('rol:admin,jefe,carga');
    Route::post('/items/{item}/reactivar', [ItemController::class, 'reactivar'])->middleware('rol:admin,jefe');
    Route::delete('/items/{item}', [ItemController::class, 'destroy'])->middleware('rol:admin');

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