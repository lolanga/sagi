<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Movimiento;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReporteControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Unidad $unidad;

    protected function setUp(): void
    {
        parent::setUp();

        $rol = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);

        $this->admin = User::factory()->create(['rol_id' => $rol->id, 'sede_id' => $sede->id]);

        $this->unidad = Unidad::firstOrCreate(
            ['sede_id' => $sede->id, 'nombre' => 'Deposito Central'],
            ['activa' => true, 'es_transitoria' => false]
        );
    }

    private function crearItem(string $codigo): void
    {
        $categoria = Categoria::firstOrCreate(
            ['codigo' => 'A5'],
            ['nombre' => 'Maquinas y herramientas', 'es_transitoria' => false]
        );

        \App\Models\Item::create([
            'codigo_unico' => $codigo,
            'categoria_id' => $categoria->id,
            'responsable_id' => $this->admin->id,
            'unidad_id' => $this->unidad->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'valores_dinamicos' => [],
            'estado' => 'activo',
        ]);
    }

    public function test_resumen_devuelve_200_en_cualquier_driver_de_base(): void
    {
        $this->crearItem('A5-00001-TEST');

        Movimiento::create([
            'item_id' => \App\Models\Item::first()->id,
            'tipo' => 'alta',
            'unidad_origen_id' => $this->unidad->id,
            'unidad_destino_id' => null,
            'motivo' => 'Alta inicial',
            'estado' => 'aprobado',
            'solicitante_id' => $this->admin->id,
            'fecha_validacion' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reportes/resumen');

        $response->assertOk();

        $response->assertJsonStructure([
            'por_categoria',
            'por_estado_conservacion',
            'por_sede',
            'por_unidad',
            'por_elemento',
            'movimientos_mes',
        ]);
    }

    public function test_resumen_agrupa_movimientos_por_mes(): void
    {
        $this->crearItem('A5-00002-TEST');

        Movimiento::create([
            'item_id' => \App\Models\Item::first()->id,
            'tipo' => 'alta',
            'unidad_origen_id' => $this->unidad->id,
            'unidad_destino_id' => null,
            'motivo' => 'Alta inicial',
            'estado' => 'aprobado',
            'solicitante_id' => $this->admin->id,
            'fecha_validacion' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reportes/resumen')
            ->assertOk();

        $meses = $response->json('movimientos_mes');

        $this->assertNotEmpty($meses, 'Debe devolver al menos un mes con movimientos.');
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}$/',
            $meses[0]['mes'],
            'El campo mes debe tener formato YYYY-MM en cualquier driver.'
        );
    }

    public function test_items_filtra_por_categoria_y_estado(): void
    {
        $this->crearItem('A5-00003-TEST');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reportes/items?estado=activo')
            ->assertOk();

        $this->assertCount(1, $response->json());
    }
}
