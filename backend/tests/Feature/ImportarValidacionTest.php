<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\TipoItem;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fase 1 de la carga masiva: la validacion en seco. Lo que hay que probar es
 * que devuelva errores con la misma regla que un alta manual y que no escriba
 * una sola fila.
 */
class ImportarValidacionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $carga;

    private Unidad $unidad;

    private Categoria $categoriaA5;

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

        $this->categoriaA5 = Categoria::where('codigo', 'A5')->firstOrFail();

        $this->tipoA5 = TipoItem::where('categoria_id', $this->categoriaA5->id)
            ->whereDoesntHave('campos', fn ($q) => $q->where('requerido', true))
            ->firstOrFail();
    }

    private function cuerpo(array $filas, array $headers = [], array $sobrescribir = []): array
    {
        return array_merge([
            'unidad_id' => $this->unidad->id,
            'motivo_alta' => 'Carga masiva de prueba',
            'headers' => $headers === [] ? ['categoria', 'elemento', 'cantidad', 'estado_conservacion'] : $headers,
            'filas' => $filas,
        ], $sobrescribir);
    }

    private function validar(array $payload)
    {
        return $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/importar/validar', $payload);
    }

    private function contarBase(): array
    {
        return [
            'items' => Item::count(),
            'movimientos' => Movimiento::count(),
            'auditoria' => Auditoria::count(),
        ];
    }

    public function test_fila_valida_se_acepta_y_no_escribe_nada(): void
    {
        $antes = $this->contarBase();

        // Estado en minusculas: la validacion lo tiene que acomodar solo.
        $this->validar($this->cuerpo([
            ['A5', $this->tipoA5->nombre, '2', 'bueno'],
        ]))->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('validas', 1)
            ->assertJsonPath('con_errores', 0)
            ->assertJsonPath('errores', []);

        $this->assertSame($antes, $this->contarBase(), 'La validacion en seco no debe escribir nada.');
    }

    public function test_una_fila_mala_no_detiene_las_demas(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo([
            ['A5', $this->tipoA5->nombre, '1', 'Bueno'],
            ['A5', $this->tipoA5->nombre, '1', ''],      // sin estado
            ['A5', $this->tipoA5->nombre, '1', 'Malo'],
        ]))->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonPath('validas', 2)
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.fila', 2)
            ->assertJsonPath('errores.0.campo', 'estado_conservacion');

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_falta_un_campo_dinamico_obligatorio(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo(
            [['A1', 'Armario', 'Bueno']],
            ['categoria', 'elemento', 'estado_conservacion']
        ))->assertOk()
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.fila', 1)
            ->assertJsonPath('errores.0.campo', 'valores');

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_columna_desconocida_se_reporta_sin_bloquear(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo(
            [['A5', $this->tipoA5->nombre, '1', 'Bueno', 'rojo']],
            ['categoria', 'elemento', 'cantidad', 'estado_conservacion', 'Colorr']
        ))->assertOk()
            ->assertJsonPath('validas', 1)
            ->assertJsonPath('con_errores', 0)
            ->assertJsonPath('columnas_ignoradas.0.columna', 'Colorr')
            ->assertJsonPath('columnas_ignoradas.0.filas.0', 1);

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_categoria_transitoria_se_rechaza(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo(
            [['A7', 'Por compra', 'Bueno']],
            ['categoria', 'elemento', 'estado_conservacion']
        ))->assertOk()
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.campo', 'categoria');

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_elemento_inexistente_se_rechaza(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo([
            ['A5', 'Noseque', '1', 'Bueno'],
        ]))->assertOk()
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.campo', 'elemento');

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_estado_fuera_de_la_lista_se_rechaza(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo([
            ['A5', $this->tipoA5->nombre, '1', 'En reparación'],
        ]))->assertOk()
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.campo', 'estado_conservacion');

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_fecha_serial_de_excel_se_convierte(): void
    {
        $antes = $this->contarBase();

        // 46037 = 2026-01-15: si no se convirtiera, la regla de fecha fallaria.
        $this->validar($this->cuerpo(
            [['A5', $this->tipoA5->nombre, '1', 'Bueno', 46037]],
            ['categoria', 'elemento', 'cantidad', 'estado_conservacion', 'fecha_alta']
        ))->assertOk()
            ->assertJsonPath('validas', 1)
            ->assertJsonPath('con_errores', 0);

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_fecha_imposible_se_rechaza(): void
    {
        $antes = $this->contarBase();

        $this->validar($this->cuerpo(
            [['A5', $this->tipoA5->nombre, '1', 'Bueno', '31/02/2020']],
            ['categoria', 'elemento', 'cantidad', 'estado_conservacion', 'fecha_alta']
        ))->assertOk()
            ->assertJsonPath('con_errores', 1)
            ->assertJsonPath('errores.0.fila', 1);

        $this->assertSame($antes, $this->contarBase());
    }

    public function test_sin_la_columna_categoria_se_rechaza_el_pedido(): void
    {
        $this->validar($this->cuerpo(
            [['Bueno']],
            ['estado_conservacion']
        ))->assertStatus(422)
            ->assertJsonPath('errors.headers.0', "Falta la columna 'categoria'");
    }

    public function test_requiere_rol_admin(): void
    {
        $this->actingAs($this->carga, 'sanctum')
            ->postJson('/api/importar/validar', $this->cuerpo([
                ['A5', $this->tipoA5->nombre, '1', 'Bueno'],
            ]))
            ->assertStatus(403);
    }

    public function test_la_plantilla_deja_ver_el_formato_esperado(): void
    {
        $respuesta = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/importar/plantilla')
            ->assertOk()
            ->assertJsonPath('columnas_fijas.0', 'categoria');

        $a5 = collect($respuesta->json('categorias'))->firstWhere('codigo', 'A5');

        $this->assertNotNull($a5, 'La plantilla debe listar A5.');
        $this->assertTrue($a5['requiere_elemento']);
        $this->assertNotEmpty($a5['elementos']);
        $this->assertNotEmpty($a5['campos']);
    }
}
