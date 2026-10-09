<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Importacion;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\TipoItem;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Fase 2: la carga de verdad. Lo importante es que escriba una vez y solo
 * una, aunque el navegador vuelva a mandar el mismo lote.
 */
class ImportarEjecucionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $carga;

    private Unidad $unidad;

    private TipoItem $tipoA5;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $this->seed(\Database\Seeders\EstructuraCategoriasSeeder::class);

        $rolAdmin = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $rolCarga = Rol::firstOrCreate(['slug' => 'carga'], ['nombre' => 'Personal de carga']);
        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);

        $this->admin = User::factory()->create(['rol_id' => $rolAdmin->id, 'sede_id' => $sede->id]);
        $this->carga = User::factory()->create(['rol_id' => $rolCarga->id, 'sede_id' => $sede->id]);

        $this->unidad = Unidad::firstOrCreate(
            ['sede_id' => $sede->id, 'nombre' => 'Deposito Central'],
            ['activa' => true]
        );

        $categoriaA5 = Categoria::where('codigo', 'A5')->firstOrFail();

        $this->tipoA5 = TipoItem::where('categoria_id', $categoriaA5->id)
            ->whereDoesntHave('campos', fn ($q) => $q->where('requerido', true))
            ->firstOrFail();
    }

    private function cuerpo(array $filas, array $sobrescribir = []): array
    {
        return array_merge([
            'unidad_id' => $this->unidad->id,
            'motivo_alta' => 'Carga masiva de prueba',
            'import_uuid' => (string) Str::uuid(),
            'lote' => 1,
            'headers' => ['categoria', 'elemento', 'cantidad', 'estado_conservacion'],
            'filas' => $filas,
        ], $sobrescribir);
    }

    private function ejecutar(array $payload)
    {
        return $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/importar/ejecutar', $payload);
    }

    private function contarBase(): array
    {
        return [
            'items' => Item::count(),
            'movimientos' => Movimiento::count(),
            'auditoria' => Auditoria::count(),
            'importaciones' => Importacion::count(),
        ];
    }

    public function test_ejecutar_crea_los_items(): void
    {
        $antes = $this->contarBase();
        $payload = $this->cuerpo([
            ['A5', $this->tipoA5->nombre, '2', 'Bueno'],
            ['A5', $this->tipoA5->nombre, '1', 'Malo'],
        ]);

        $this->ejecutar($payload)->assertOk()
            ->assertJsonPath('insertados', 2)
            ->assertJsonPath('fallidas', 0)
            ->assertJsonPath('errores', [])
            ->assertJsonPath('duplicado', false);

        $despues = $this->contarBase();

        $this->assertSame($antes['items'] + 2, $despues['items'], 'Cada fila valida debe dar de alta un item.');
        $this->assertSame($antes['movimientos'] + 2, $despues['movimientos'], 'Y su movimiento de alta.');
        $this->assertSame($antes['auditoria'] + 2, $despues['auditoria'], 'Y su registro de auditoria.');
        $this->assertSame($antes['importaciones'] + 1, $despues['importaciones']);

        $respuesta = $this->ejecutar($payload)->assertOk()->json();
        $this->assertCount(2, $respuesta['codigos']);
        $this->assertCount(2, array_unique($respuesta['codigos']), 'Los codigos deben ser todos distintos.');
    }

    public function test_el_mismo_lote_no_se_procesa_dos_veces(): void
    {
        $payload = $this->cuerpo([
            ['A5', $this->tipoA5->nombre, '2', 'Bueno'],
        ]);

        $primera = $this->ejecutar($payload)->assertOk()->json();
        $medio = $this->contarBase();

        // El navegador reintenta el mismo lote: tiene que devolver lo mismo
        // y no volver a insertar.
        $segunda = $this->ejecutar($payload)->assertOk()->json();

        $this->assertTrue($segunda['duplicado']);
        $this->assertSame($primera['codigos'], $segunda['codigos']);
        $this->assertSame($medio, $this->contarBase(), 'El lote repetido no debe tocar la base.');
        $this->assertSame(1, Importacion::count());
    }

    public function test_fila_mala_no_detiene_las_buenas(): void
    {
        $antes = $this->contarBase();

        $this->ejecutar($this->cuerpo([
            ['ZZ', 'Nada', '1', 'Bueno'],
            ['A5', $this->tipoA5->nombre, '1', 'Bueno'],
        ]))->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('insertados', 1)
            ->assertJsonPath('fallidas', 1)
            ->assertJsonPath('errores.0.fila', 1)
            ->assertJsonPath('errores.0.campo', 'categoria');

        $this->assertSame($antes['items'] + 1, Item::count());
    }

    public function test_lote_interrumpido_no_permite_reintentar(): void
    {
        $payload = $this->cuerpo([
            ['A5', $this->tipoA5->nombre, '1', 'Bueno'],
        ]);

        Importacion::create([
            'import_uuid' => $payload['import_uuid'],
            'lote' => $payload['lote'],
            'filas' => 1,
            'user_id' => $this->admin->id,
            'estado' => 'en_progreso',
        ]);

        $antes = $this->contarBase();

        $this->ejecutar($payload)->assertStatus(409);

        $this->assertSame($antes, $this->contarBase(), 'Un lote interrumpido no debe cargar nada nuevo.');
    }

    public function test_no_acepta_mas_de_mil_filas_por_lote(): void
    {
        $filas = array_fill(0, 1001, ['A5', $this->tipoA5->nombre, '1', 'Bueno']);

        $this->ejecutar($this->cuerpo($filas))->assertStatus(422)
            ->assertJsonValidationErrors('filas');

        $this->assertSame(0, Importacion::count(), 'Ni siquiera debe reservarse el lote.');
    }

    public function test_requiere_import_uuid_y_lote(): void
    {
        $this->ejecutar($this->cuerpo([['A5', $this->tipoA5->nombre, '1', 'Bueno']], [
            'import_uuid' => null,
            'lote' => null,
        ]))->assertStatus(422)
            ->assertJsonValidationErrors(['import_uuid', 'lote']);
    }

    public function test_requiere_rol_admin(): void
    {
        $antes = $this->contarBase();
        $payload = $this->cuerpo([['A5', $this->tipoA5->nombre, '1', 'Bueno']]);

        $this->actingAs($this->carga, 'sanctum')
            ->postJson('/api/importar/ejecutar', $payload)
            ->assertStatus(403);

        $this->assertSame(0, Importacion::count(), 'Sin permiso no debe reservarse el lote.');
        $this->assertSame($antes, $this->contarBase(), 'Sin permiso no debe cargarse nada.');
    }
}
