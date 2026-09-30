<?php

namespace Tests\Feature;

use App\Http\Controllers\ItemController;
use App\Models\CampoDinamico;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\TipoItem;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormatoValoresTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Unidad $unidad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $rol = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);
        $this->admin = User::factory()->create(['rol_id' => $rol->id, 'sede_id' => $sede->id]);
        $this->unidad = Unidad::firstOrCreate(
            ['sede_id' => $sede->id, 'nombre' => 'Deposito Formato'],
            ['activa' => true]
        );
    }

    public function test_los_campos_de_medida_existen_en_la_estructura(): void
    {
        $nombres = (new \ReflectionClass(ItemController::class))->getConstant('CAMPOS_MAYUSCULAS');
        $existentes = CampoDinamico::where('activo', true)->pluck('nombre')->all();

        $this->assertNotEmpty($nombres);

        foreach ($nombres as $nombre) {
            $this->assertContains(
                $nombre,
                $existentes,
                "El campo '{$nombre}' del listado de mayusculas no existe en la estructura de categorias."
            );
        }
    }

    public function test_el_alta_convierte_los_campos_de_medida_a_mayusculas(): void
    {
        [$categoria, $tipo] = $this->elementoDe('A1');
        $campos = $this->camposPorNombre($tipo, ['Medidas', 'Color']);

        $valores = array_replace($this->completarRequeridos($tipo), [
            $campos['Medidas']->id => '60 x 60 x 75 cm',
            $campos['Color']->id => 'negro',
        ]);

        $this->crearItem($categoria->id, $tipo->id, $valores)->assertCreated();

        $item = Item::orderByDesc('id')->first();

        $this->assertSame(
            '60 X 60 X 75 CM',
            $item->valores_dinamicos[$campos['Medidas']->id],
            'El campo Medidas debe guardarse en mayusculas.'
        );
        $this->assertSame(
            'negro',
            $item->valores_dinamicos[$campos['Color']->id],
            'Los campos que no son de medida no deben tocarse.'
        );
    }

    public function test_el_alta_rechaza_una_observacion_de_mas_de_150_caracteres(): void
    {
        [$categoria, $tipo] = $this->elementoDe('A1');
        $obs = $this->camposPorNombre($tipo, ['Observaciones'])['Observaciones'];

        $this->crearItem($categoria->id, $tipo->id, array_replace($this->completarRequeridos($tipo), [
            $obs->id => str_repeat('x', 151),
        ]))->assertStatus(422);
    }

    public function test_el_alta_acepta_observaciones_de_150_caracteres(): void
    {
        [$categoria, $tipo] = $this->elementoDe('A1');
        $obs = $this->camposPorNombre($tipo, ['Observaciones'])['Observaciones'];

        $this->crearItem($categoria->id, $tipo->id, array_replace($this->completarRequeridos($tipo), [
            $obs->id => str_repeat('x', 150),
        ]))->assertCreated();
    }

    public function test_las_observaciones_siguen_siendo_opcionales(): void
    {
        [$categoria, $tipo] = $this->elementoDe('A1');
        $obs = $this->camposPorNombre($tipo, ['Observaciones'])['Observaciones'];

        $this->crearItem($categoria->id, $tipo->id, $this->completarRequeridos($tipo))
            ->assertCreated();

        $item = Item::orderByDesc('id')->first();

        $this->assertArrayNotHasKey($obs->id, $item->valores_dinamicos);
    }

    public function test_la_edicion_tambien_aplica_mayusculas_y_el_limite(): void
    {
        [$categoria, $tipo] = $this->elementoDe('A1');
        $campos = $this->camposPorNombre($tipo, ['Medidas', 'Observaciones']);

        $this->crearItem($categoria->id, $tipo->id, $this->completarRequeridos($tipo))->assertCreated();
        $item = Item::orderByDesc('id')->first();
        $medidasId = $campos['Medidas']->id;
        $medidasOriginales = $item->valores_dinamicos[$medidasId];

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/items/{$item->id}", [
                'valores' => array_replace($this->completarRequeridos($tipo), [
                    $medidasId => '80 x 40 x 10 cm',
                    $campos['Observaciones']->id => str_repeat('y', 151),
                ]),
            ])
            ->assertStatus(422);

        $item->refresh();
        $this->assertSame($medidasOriginales, $item->valores_dinamicos[$medidasId],
            'Si la validacion falla, no debe modificarse ningun valor.');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/items/{$item->id}", [
                'valores' => array_replace($this->completarRequeridos($tipo), [
                    $medidasId => '80 x 40 x 10 cm',
                    $campos['Observaciones']->id => 'Revisado en taller',
                ]),
            ])
            ->assertOk();

        $item->refresh();

        $this->assertSame('80 X 40 X 10 CM', $item->valores_dinamicos[$medidasId]);
        $this->assertSame('Revisado en taller', $item->valores_dinamicos[$campos['Observaciones']->id]);
    }

    /** @return array{0: Categoria, 1: TipoItem} */
    private function elementoDe(string $codigo): array
    {
        $categoria = Categoria::where('codigo', $codigo)->firstOrFail();
        $tipo = TipoItem::where('categoria_id', $categoria->id)->orderBy('id')->firstOrFail();

        return [$categoria, $tipo];
    }

    /** @return array<string, CampoDinamico> */
    private function camposPorNombre(TipoItem $tipo, array $nombres): array
    {
        return CampoDinamico::where('tipo_item_id', $tipo->id)
            ->where('activo', true)
            ->whereIn('nombre', $nombres)
            ->get()
            ->keyBy('nombre')
            ->all();
    }

    /** @return array<int, string> valores para todos los campos obligatorios del elemento */
    private function completarRequeridos(TipoItem $tipo): array
    {
        $valores = [];

        $campos = CampoDinamico::where('tipo_item_id', $tipo->id)
            ->where('activo', true)
            ->where('requerido', true)
            ->get();

        foreach ($campos as $campo) {
            $opciones = $campo->opciones;

            $valores[$campo->id] = match ($campo->tipo) {
                'select' => is_array($opciones) && $opciones ? $opciones[0] : 'Otro',
                'numero', 'decimal' => '1',
                'fecha', 'date' => now()->toDateString(),
                default => 'Valor de prueba',
            };
        }

        return $valores;
    }

    private function crearItem(int $categoriaId, ?int $tipoId, array $valores)
    {
        return $this->actingAs($this->admin, 'sanctum')->postJson('/api/items', [
            'categoria_id' => $categoriaId,
            'tipo_item_id' => $tipoId,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'unidad_id' => $this->unidad->id,
            'motivo_alta' => 'Prueba de formato',
            'fecha_alta' => now()->toDateString(),
            'valores' => $valores,
        ]);
    }
}
