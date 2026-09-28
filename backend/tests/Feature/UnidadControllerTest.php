<?php

namespace Tests\Feature;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UnidadControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Sede $sede;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $rol = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $this->sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);
        $this->admin = User::factory()->create(['rol_id' => $rol->id, 'sede_id' => $this->sede->id]);
    }

    public function test_elimina_unidad_sin_referencias(): void
    {
        $unidad = $this->crearUnidad('Deposito Sin Uso');

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/unidades/{$unidad->id}")
            ->assertOk();

        $this->assertDatabaseMissing('unidades', ['id' => $unidad->id]);
        $this->assertSame(
            1,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'unidad')->where('entidad_id', $unidad->id)->count()
        );
    }

    public function test_no_elimina_unidad_con_items(): void
    {
        $unidad = $this->crearUnidad('Deposito Con Items');
        $this->crearItem($unidad, 'A5-00001-TEST');

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/unidades/{$unidad->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('unidades', ['id' => $unidad->id]);
        $this->assertSame(
            0,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'unidad')->count(),
            'Una eliminacion rechazada no debe dejar auditoria.'
        );
    }

    public function test_no_elimina_unidad_con_alertas_y_no_registra_auditoria(): void
    {
        $unidad = $this->crearUnidad('Deposito Con Alertas');

        Alerta::create([
            'unidad_id' => $unidad->id,
            'tipo' => 'pendiente_aprobacion',
            'prioridad' => 'importante',
            'mensaje' => 'Traslado pendiente',
            'estado' => 'cerrada',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/unidades/{$unidad->id}")
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'No se puede eliminar la unidad porque tiene alertas vinculadas. Desactívela en su lugar.']);

        $this->assertDatabaseHas('unidades', ['id' => $unidad->id]);
        $this->assertSame(
            0,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'unidad')->count(),
            'Una eliminacion rechazada no debe dejar auditoria.'
        );
    }

    public function test_no_elimina_unidad_participante_de_un_movimiento(): void
    {
        $unidadOrigen = $this->crearUnidad('Deposito Origen');
        $unidadDestino = $this->crearUnidad('Deposito Destino');
        $item = $this->crearItem($unidadOrigen, 'A5-00002-TEST');

        Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $unidadOrigen->id,
            'unidad_destino_id' => $unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'aprobado',
            'solicitante_id' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/unidades/{$unidadOrigen->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('unidades', ['id' => $unidadOrigen->id]);
        $this->assertSame(
            0,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'unidad')->count(),
            'Una eliminacion rechazada no debe dejar auditoria.'
        );
    }

    private function crearUnidad(string $nombre): Unidad
    {
        return Unidad::create([
            'nombre' => $nombre,
            'sede_id' => $this->sede->id,
            'activa' => true,
        ]);
    }

    private function crearItem(Unidad $unidad, string $codigo): Item
    {
        return Item::create([
            'codigo_unico' => $codigo,
            'categoria_id' => \App\Models\Categoria::where('codigo', 'A5')->firstOrFail()->id,
            'responsable_id' => $this->admin->id,
            'unidad_id' => $unidad->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'valores_dinamicos' => [],
            'estado' => 'activo',
        ]);
    }
}
