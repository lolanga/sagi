<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SedeControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $rol = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);
        $this->admin = User::factory()->create(['rol_id' => $rol->id, 'sede_id' => $sede->id]);
    }

    public function test_elimina_sede_sin_referencias(): void
    {
        $sede = Sede::create(['nombre' => 'Sede Sin Referencias', 'activa' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/sedes/{$sede->id}")
            ->assertOk();

        $this->assertDatabaseMissing('sedes', ['id' => $sede->id]);
        $this->assertSame(
            1,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'sede')->where('entidad_id', $sede->id)->count()
        );
    }

    public function test_no_elimina_sede_con_usuarios(): void
    {
        $sede = Sede::create(['nombre' => 'Sede Con Usuarios', 'activa' => true]);
        User::factory()->create(['rol_id' => $this->admin->rol_id, 'sede_id' => $sede->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/sedes/{$sede->id}")
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'No se puede eliminar la sede porque tiene usuarios asignados. Desactívela en su lugar.']);

        $this->assertDatabaseHas('sedes', ['id' => $sede->id]);
        $this->assertSame(
            0,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'sede')->count(),
            'Una eliminacion rechazada no debe dejar auditoria.'
        );
    }

    public function test_no_elimina_sede_con_unidades(): void
    {
        $sede = Sede::create(['nombre' => 'Sede Con Unidades', 'activa' => true]);
        Unidad::create(['nombre' => 'Deposito', 'sede_id' => $sede->id, 'activa' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/sedes/{$sede->id}")
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'No se puede eliminar la sede porque tiene unidades de destino asociadas. Desactívela en su lugar.']);

        $this->assertDatabaseHas('sedes', ['id' => $sede->id]);
        $this->assertSame(
            0,
            Auditoria::where('accion', 'eliminar')->where('entidad', 'sede')->count(),
            'Una eliminacion rechazada no debe dejar auditoria.'
        );
    }

    public function test_index_incluye_el_conteo_de_usuarios(): void
    {
        $sede = Sede::create(['nombre' => 'Sede Con Conteo', 'activa' => true]);
        User::factory()->create(['rol_id' => $this->admin->rol_id, 'sede_id' => $sede->id]);

        $respuesta = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/sedes')
            ->assertOk()
            ->json('sedes');

        $encontrada = collect($respuesta)->firstWhere('id', $sede->id);

        $this->assertNotNull($encontrada);
        $this->assertSame(1, $encontrada['usuarios_count']);
    }
}
