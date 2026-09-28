<?php

namespace Tests\Feature;

use App\Models\Alerta;
use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FlujoItemTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $jefe;

    private Categoria $categoriaA5;

    private Categoria $categoriaA7;

    private Unidad $unidadOrigen;

    private Unidad $unidadDestino;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $this->seed(\Database\Seeders\EstructuraCategoriasSeeder::class);

        $rolAdmin = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $rolJefe = Rol::firstOrCreate(['slug' => 'jefe'], ['nombre' => 'Jefe de area']);

        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);

        $this->admin = User::factory()->create(['rol_id' => $rolAdmin->id, 'sede_id' => $sede->id]);
        $this->jefe = User::factory()->create(['rol_id' => $rolJefe->id, 'sede_id' => $sede->id]);

        $this->categoriaA5 = Categoria::where('codigo', 'A5')->firstOrFail();
        $this->categoriaA7 = Categoria::where('codigo', 'A7')->firstOrFail();

        $this->unidadOrigen = Unidad::firstOrCreate(
            ['sede_id' => $sede->id, 'nombre' => 'Deposito Central'],
            ['activa' => true, 'es_transitoria' => false]
        );

        $sede2 = Sede::firstOrCreate(['nombre' => 'Sede Rosario'], ['activa' => true]);
        $this->unidadDestino = Unidad::firstOrCreate(
            ['sede_id' => $sede2->id, 'nombre' => 'Deposito Rosario'],
            ['activa' => true, 'es_transitoria' => false]
        );
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'categoria_id' => $this->categoriaA5->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 3,
            'unidad_id' => $this->unidadOrigen->id,
            'motivo_alta' => 'Compra para dependencia',
            'fecha_alta' => now()->toDateString(),
            'valores' => [],
        ], $overrides);
    }

    public function test_crear_item_registra_movimiento_alta_y_auditoria(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/items', $this->payload());

        $response->assertCreated();

        $item = Item::firstOrFail();

        $this->assertSame('activo', $item->estado);
        $this->assertSame($this->categoriaA7->id, $item->categoria_id, 'El alta debe quedar en la categoria transitoria A7.');

        $this->assertDatabaseHas('movimientos', [
            'item_id' => $item->id,
            'tipo' => 'alta',
            'unidad_origen_id' => $this->unidadOrigen->id,
        ]);

        $auditoria = Auditoria::where('accion', 'crear')->where('entidad', 'item')->first();
        $this->assertNotNull($auditoria, 'Debe existir auditoria de creacion.');
        $this->assertSame($this->admin->id, $auditoria->user_id);
        $this->assertArrayHasKey('cantidad', $auditoria->detalle);
    }

    public function test_crear_item_es_atomico_si_falla_la_auditoria(): void
    {
        Auditoria::creating(fn () => throw new \RuntimeException('Falla simulada de auditoria'));

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/items', $this->payload())
            ->assertStatus(500);

        $this->assertSame(0, Item::count(), 'No debe quedar ningun item si la transaccion falla.');
        $this->assertSame(0, Movimiento::count(), 'No debe quedar ningun movimiento si la transaccion falla.');
    }

    public function test_editar_item_audita_antes_y_despues(): void
    {
        $item = Item::create([
            'codigo_unico' => 'A5-00001-TEST',
            'categoria_id' => $this->categoriaA5->id,
            'responsable_id' => $this->admin->id,
            'unidad_id' => $this->unidadOrigen->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'valores_dinamicos' => [],
            'estado' => 'activo',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/items/{$item->id}", [
                'estado_conservacion' => 'Malo',
                'cantidad' => 7,
            ])
            ->assertOk();

        $auditoria = Auditoria::where('accion', 'editar')->where('entidad', 'item')->latest('id')->first();

        $this->assertNotNull($auditoria);
        $this->assertSame('Bueno', $auditoria->detalle['antes']['estado_conservacion']);
        $this->assertSame('Malo', $auditoria->detalle['despues']['estado_conservacion']);
        $this->assertSame(1, (int) $auditoria->detalle['antes']['cantidad']);
        $this->assertSame(7, (int) $auditoria->detalle['despues']['cantidad']);
    }

    public function test_editar_item_es_atomico_si_falla_la_auditoria(): void
    {
        $item = Item::create([
            'codigo_unico' => 'A5-00002-TEST',
            'categoria_id' => $this->categoriaA5->id,
            'responsable_id' => $this->admin->id,
            'unidad_id' => $this->unidadOrigen->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 4,
            'valores_dinamicos' => [],
            'estado' => 'activo',
        ]);

        Auditoria::creating(fn () => throw new \RuntimeException('Falla simulada'));

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/items/{$item->id}", ['cantidad' => 99])
            ->assertStatus(500);

        $this->assertSame(4, (int) $item->fresh()->cantidad, 'El cambio debe revertirse si la auditoria falla.');
    }

    public function test_aprobar_traslado_cambia_unidad_y_audita_origen_destino(): void
    {
        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => $this->unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'pendiente',
            'solicitante_id' => $this->jefe->id,
        ]);

        Alerta::create([
            'item_id' => $item->id,
            'movimiento_id' => $movimiento->id,
            'unidad_id' => $this->unidadOrigen->id,
            'tipo' => 'pendiente_aprobacion',
            'prioridad' => 'importante',
            'mensaje' => 'Traslado pendiente de aprobacion',
            'estado' => 'abierta',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/aprobar", ['motivo' => 'Ok'])
            ->assertOk();

        $this->assertSame($this->unidadDestino->id, $item->fresh()->unidad_id);
        $this->assertSame('aprobado', $movimiento->fresh()->estado);

        $auditoria = Auditoria::where('accion', 'aprobar')->latest('id')->first();
        $this->assertNotNull($auditoria);
        $this->assertSame($this->unidadOrigen->nombre, $auditoria->detalle['unidad_origen']);
        $this->assertSame($this->unidadDestino->nombre, $auditoria->detalle['unidad_destino']);

        $this->assertSame('cerrada', Alerta::where('movimiento_id', $movimiento->id)->first()->estado);
    }

    public function test_aprobar_baja_deja_el_item_en_estado_baja(): void
    {
        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'baja',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => null,
            'motivo' => 'Obsoleto',
            'estado' => 'pendiente',
            'solicitante_id' => $this->jefe->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/aprobar", [])
            ->assertOk();

        $item->refresh();

        $this->assertSame('baja', $item->estado);
        $this->assertNotNull($item->fecha_baja);
        $this->assertNotNull($item->categoria_original_id);
    }

    public function test_rechazar_movimiento_es_atomico_y_cierra_alertas(): void
    {
        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => $this->unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'pendiente',
            'solicitante_id' => $this->jefe->id,
        ]);

        $alerta = Alerta::create([
            'item_id' => $item->id,
            'movimiento_id' => $movimiento->id,
            'unidad_id' => $this->unidadOrigen->id,
            'tipo' => 'pendiente_aprobacion',
            'prioridad' => 'importante',
            'mensaje' => 'Pendiente',
            'estado' => 'abierta',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/rechazar", ['motivo_rechazo' => 'Sin presupuesto'])
            ->assertOk();

        $this->assertSame('rechazado', $movimiento->fresh()->estado);
        $this->assertSame('cerrada', $alerta->fresh()->estado);
        $this->assertDatabaseHas('auditoria', ['accion' => 'rechazar', 'entidad' => 'movimiento']);
    }

    public function test_rechazar_es_atomico_si_falla_la_auditoria(): void
    {
        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => $this->unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'pendiente',
            'solicitante_id' => $this->jefe->id,
        ]);

        $alerta = Alerta::create([
            'item_id' => $item->id,
            'movimiento_id' => $movimiento->id,
            'unidad_id' => $this->unidadOrigen->id,
            'tipo' => 'pendiente_aprobacion',
            'prioridad' => 'importante',
            'mensaje' => 'Pendiente',
            'estado' => 'abierta',
        ]);

        Auditoria::creating(fn () => throw new \RuntimeException('Falla simulada'));

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/rechazar", ['motivo_rechazo' => 'No'])
            ->assertStatus(500);

        $this->assertSame('pendiente', $movimiento->fresh()->estado, 'El movimiento debe quedar pendiente.');
        $this->assertSame('abierta', $alerta->fresh()->estado, 'La alerta no debe cerrarse si la transaccion falla.');
    }

    public function test_reactivar_item_registra_el_motivo_de_baja_anterior(): void
    {
        $item = $this->crearItemHelper();

        $item->update([
            'estado' => 'baja',
            'motivo_baja' => 'Equipo en reparacion',
            'fecha_baja' => now(),
            'categoria_original_id' => $this->categoriaA5->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/items/{$item->id}/reactivar", ['motivo_reactivacion' => 'Reparado'])
            ->assertOk();

        $auditoria = Auditoria::where('accion', 'reactivar')->latest('id')->first();

        $this->assertNotNull($auditoria);
        $this->assertSame('baja', $auditoria->detalle['estado_anterior']);
        $this->assertSame('activo', $auditoria->detalle['estado_nuevo']);
        $this->assertSame('Equipo en reparacion', $auditoria->detalle['motivo_baja_anterior']);
    }

    public function test_eliminar_item_audita_y_no_deja_movimientos_huerfanos(): void
    {
        $item = $this->crearItemHelper();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/items/{$item->id}")
            ->assertOk();

        $this->assertDatabaseMissing('items', ['id' => $item->id]);
        $this->assertSame(0, Movimiento::where('item_id', $item->id)->count());
        $this->assertDatabaseHas('auditoria', ['accion' => 'eliminar', 'entidad' => 'item']);
    }

    public function test_buscar_por_texto_en_campos_dinamicos_no_falla(): void
    {
        $this->crearItemHelper();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/items?search=A5')
            ->assertOk();
    }

    public function test_usuario_de_carga_no_puede_aprobar_movimientos(): void
    {
        $rolCarga = Rol::firstOrCreate(['slug' => 'carga'], ['nombre' => 'Personal de carga']);
        $usuarioCarga = User::factory()->create([
            'rol_id' => $rolCarga->id,
            'sede_id' => $this->unidadOrigen->sede_id,
        ]);

        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => $this->unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'pendiente',
            'solicitante_id' => $this->jefe->id,
        ]);

        $this->actingAs($usuarioCarga, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/aprobar", [])
            ->assertStatus(403);

        $this->assertSame('pendiente', $movimiento->fresh()->estado);
    }

    public function test_solicitante_no_puede_aprobarse_a_si_mismo(): void
    {
        $item = $this->crearItemHelper();

        $movimiento = Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'traslado',
            'unidad_origen_id' => $this->unidadOrigen->id,
            'unidad_destino_id' => $this->unidadDestino->id,
            'motivo' => 'Reubicacion',
            'estado' => 'pendiente',
            'solicitante_id' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/movimientos/{$movimiento->id}/aprobar", []);

        $this->assertNotSame(
            'aprobado',
            $movimiento->fresh()->estado,
            'Un usuario no deberia poder aprobar su propia solicitud.'
        );
    }

    public function test_requiere_autenticacion(): void
    {
        $this->postJson('/api/items', $this->payload())->assertStatus(401);
    }

    private function crearItemHelper(): Item
    {
        return Item::create([
            'codigo_unico' => 'A5-'.str_pad((string) (Item::count() + 1), 5, '0', STR_PAD_LEFT).'-TEST',
            'categoria_id' => $this->categoriaA5->id,
            'responsable_id' => $this->admin->id,
            'unidad_id' => $this->unidadOrigen->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'valores_dinamicos' => [],
            'estado' => 'activo',
        ]);
    }
}
