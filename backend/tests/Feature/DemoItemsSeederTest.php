<?php

namespace Tests\Feature;

use App\Models\Auditoria;
use App\Models\CampoDinamico;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\User;
use Database\Seeders\DemoItemsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoItemsSeederTest extends TestCase
{
    use RefreshDatabase;

    private const VARIABLE = 'APP_SEED_DEMO_ITEMS';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    protected function tearDown(): void
    {
        putenv(self::VARIABLE);
        unset($_ENV[self::VARIABLE], $_SERVER[self::VARIABLE]);

        parent::tearDown();
    }

    public function test_no_carga_nada_si_la_variable_no_esta_activada(): void
    {
        $this->seed(DemoItemsSeeder::class);

        $this->assertSame(0, Item::count());
    }

    public function test_carga_20_items_completos_y_no_se_repite(): void
    {
        $this->activarVariable();

        $this->seed(DemoItemsSeeder::class);

        $this->assertSame(20, Item::count());

        foreach (Item::query()->get() as $item) {
            $this->assertNotNull($item->categoria, "El item {$item->codigo_unico} quedo sin categoria.");
            $this->assertFalse($item->categoria->es_transitoria, "El item {$item->codigo_unico} quedo en una categoria transitoria.");
            $this->assertNotEmpty($item->tipoItem, "El item {$item->codigo_unico} quedo sin elemento.");

            $campos = CampoDinamico::where('tipo_item_id', $item->tipo_item_id)
                ->where('requerido', true)
                ->get();

            foreach ($campos as $campo) {
                $this->assertNotEmpty(
                    $item->valores_dinamicos[$campo->id] ?? null,
                    "El item {$item->codigo_unico} no completo el campo obligatorio '{$campo->nombre}'."
                );
            }

            $this->assertStringStartsWith(
                $item->categoria->codigo.'-',
                $item->codigo_unico,
                'El codigo unico debe empezar con la categoria real del item.'
            );
        }

        $this->assertSame(
            20,
            Movimiento::where('tipo', 'alta')->where('motivo', 'Carga de demostracion SAGI')->count(),
            'Cada item de demo debe tener su movimiento de alta.'
        );

        $this->assertSame(20, Auditoria::where('accion', 'crear')->where('entidad', 'item')->count());

        $this->seed(DemoItemsSeeder::class);

        $this->assertSame(20, Item::count(), 'Volver a correr el seeder no debe duplicar los items.');
    }

    public function test_no_carga_nada_si_no_hay_usuarios(): void
    {
        $this->activarVariable();
        User::query()->delete();

        $this->seed(DemoItemsSeeder::class);

        $this->assertSame(0, Item::count());
    }

    private function activarVariable(): void
    {
        putenv(self::VARIABLE.'=true');
        $_ENV[self::VARIABLE] = 'true';
        $_SERVER[self::VARIABLE] = 'true';
    }
}
