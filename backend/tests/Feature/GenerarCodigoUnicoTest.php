<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Item;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\TipoItem;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * El codigo unico se calcula leyendo el maximo del prefijo. Si dos altas de la
 * misma unidad hacen ese calculo a la vez, ambas terminarian en el mismo
 * numero y el unique de codigo_unico rechazaria una de las dos. Estos tests
 * cubren que las altas en lote (la carga masiva) salgan secuenciales y que un
 * duplicado se reintente en vez de devolver 500.
 */
class GenerarCodigoUnicoTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Categoria $categoriaA5;

    private TipoItem $tipoA5;

    private Unidad $unidad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $this->seed(\Database\Seeders\EstructuraCategoriasSeeder::class);

        $rolAdmin = Rol::firstOrCreate(['slug' => 'admin'], ['nombre' => 'Administrador']);
        $sede = Sede::firstOrCreate(['nombre' => 'Sede Central'], ['activa' => true]);

        $this->admin = User::factory()->create(['rol_id' => $rolAdmin->id, 'sede_id' => $sede->id]);

        $this->categoriaA5 = Categoria::where('codigo', 'A5')->firstOrFail();

        $this->tipoA5 = TipoItem::where('categoria_id', $this->categoriaA5->id)
            ->whereDoesntHave('campos', fn ($q) => $q->where('requerido', true))
            ->firstOrFail();

        $this->unidad = Unidad::firstOrCreate(
            ['sede_id' => $sede->id, 'nombre' => 'Deposito Central'],
            ['activa' => true]
        );
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'categoria_id' => $this->categoriaA5->id,
            'tipo_item_id' => $this->tipoA5->id,
            'estado_conservacion' => 'Bueno',
            'cantidad' => 1,
            'unidad_id' => $this->unidad->id,
            'motivo_alta' => 'Carga masiva de prueba',
            'fecha_alta' => now()->toDateString(),
            'valores' => [],
        ], $overrides);
    }

    public function test_lote_de_altas_genera_codigos_secuenciales_y_unicos(): void
    {
        $ultimoIdAntes = Item::max('id') ?? 0;

        for ($i = 0; $i < 15; $i++) {
            $this->actingAs($this->admin, 'sanctum')
                ->postJson('/api/items', $this->payload())
                ->assertCreated();
        }

        $prefijo = sprintf('A5-%02d-%02d-', $this->unidad->sede_id, $this->unidad->id);
        $codigos = Item::where('id', '>', $ultimoIdAntes)
            ->orderBy('id')
            ->pluck('codigo_unico')
            ->all();

        $this->assertCount(15, $codigos, 'Las 15 altas deben quedar registradas.');
        $this->assertCount(15, array_unique($codigos), 'Ninguna alta puede repetir el codigo.');

        foreach ($codigos as $i => $codigo) {
            $this->assertStringStartsWith($prefijo, $codigo, "El codigo {$codigo} debe llevar el prefijo de su unidad.");
            $this->assertMatchesRegularExpression('/^\Q'.$prefijo.'\E\d{6}$/', $codigo);

            if ($i === 0) {
                continue;
            }

            $anterior = (int) substr($codigos[$i - 1], -6);
            $actual = (int) substr($codigo, -6);

            $this->assertSame($anterior + 1, $actual, "El codigo {$codigo} debe seguir sin saltos ni repeticiones al anterior.");
        }
    }

    public function test_un_codigo_duplicado_no_falla_el_alta_y_se_reintenta(): void
    {
        $intento = 0;

        // Simula la alta concurrente que se cuela entre el calculo del maximo y
        // el insert: clava el mismo codigo_unico que esta por grabarse, asi la
        // primera transaccion viola el unique y tiene que volver a intentarse.
        Item::creating(function (Item $modelo) use (&$intento) {
            $intento++;

            if ($intento > 1) {
                return;
            }

            DB::table('items')->insert([
                'codigo_unico' => $modelo->codigo_unico,
                'categoria_id' => $modelo->categoria_id,
                'responsable_id' => $modelo->responsable_id,
                'unidad_id' => $modelo->unidad_id,
                'fecha_alta' => now()->toDateString(),
            ]);
        });

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/items', $this->payload())
            ->assertCreated();

        $this->assertSame(2, $intento, 'La transaccion debio reintentarse una vez por el codigo duplicado.');
        $this->assertSame(1, Item::count(), 'Debe quedar solo el item del alta; el intento fallido se revirtio.');
    }
}
