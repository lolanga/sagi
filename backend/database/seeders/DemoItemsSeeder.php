<?php

namespace Database\Seeders;

use App\Models\Auditoria;
use App\Models\CampoDinamico;
use App\Models\Categoria;
use App\Models\Item;
use App\Models\Movimiento;
use App\Models\TipoItem;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoItemsSeeder extends Seeder
{
    private const MOTIVO = 'Carga de demostracion SAGI';

    private const ITEMS = [
        ['categoria' => 'A1', 'elemento' => 'Escritorio', 'unidad' => 'Área Inscripción Alumnado', 'conservacion' => 'Bueno', 'cantidad' => 1, 'fecha_alta' => '2024-03-12'],
        ['categoria' => 'A1', 'elemento' => 'Silla ejecutiva', 'unidad' => 'Secretaría Escuela Superior', 'conservacion' => 'Muy bueno', 'cantidad' => 2, 'fecha_alta' => '2024-05-20'],
        ['categoria' => 'A1', 'elemento' => 'Armario', 'unidad' => 'División Archivo General', 'conservacion' => 'Regular', 'cantidad' => 1, 'fecha_alta' => '2024-08-04'],
        ['categoria' => 'A1', 'elemento' => 'Mesa', 'unidad' => 'Educación a Distancia', 'conservacion' => 'Bueno', 'cantidad' => 4, 'fecha_alta' => '2025-02-17'],
        ['categoria' => 'A1', 'elemento' => 'Pizarron', 'unidad' => 'Escuela de Investigaciones', 'conservacion' => 'Bueno', 'cantidad' => 1, 'fecha_alta' => '2025-04-09'],

        ['categoria' => 'A2', 'elemento' => 'Aire acondicionado', 'unidad' => 'Administración y Finanzas', 'conservacion' => 'Bueno', 'cantidad' => 2, 'fecha_alta' => '2024-01-22'],
        ['categoria' => 'A2', 'elemento' => 'Ventilador', 'unidad' => 'Sanidad', 'conservacion' => 'Regular', 'cantidad' => 3, 'fecha_alta' => '2024-10-11'],
        ['categoria' => 'A2', 'elemento' => 'Heladeras', 'unidad' => 'Logística', 'conservacion' => 'Muy bueno', 'cantidad' => 1, 'fecha_alta' => '2025-06-30'],

        ['categoria' => 'A3', 'elemento' => 'Computadora de escritorio', 'unidad' => 'Departamento Tecnología, Desarrollo e Innovación', 'conservacion' => 'Muy bueno', 'cantidad' => 6, 'fecha_alta' => '2024-02-05'],
        ['categoria' => 'A3', 'elemento' => 'Computadora portátil', 'unidad' => 'Secretaría Académica', 'conservacion' => 'Bueno', 'cantidad' => 3, 'fecha_alta' => '2024-07-18'],
        ['categoria' => 'A3', 'elemento' => 'Impresora', 'unidad' => 'División Archivo General', 'conservacion' => 'Regular', 'cantidad' => 2, 'fecha_alta' => '2024-11-26'],
        ['categoria' => 'A3', 'elemento' => 'Monitor', 'unidad' => 'Educación a Distancia', 'conservacion' => 'Bueno', 'cantidad' => 8, 'fecha_alta' => '2025-03-03'],
        ['categoria' => 'A3', 'elemento' => 'Proyector', 'unidad' => 'Escuela Superior', 'conservacion' => 'Bueno', 'cantidad' => 1, 'fecha_alta' => '2025-05-15'],
        ['categoria' => 'A3', 'elemento' => 'Router', 'unidad' => 'Guardia de Prevención', 'conservacion' => 'Muy bueno', 'cantidad' => 2, 'fecha_alta' => '2025-09-08'],

        ['categoria' => 'A4', 'elemento' => 'Equipo de protección personal', 'unidad' => 'Primer Compañía Rosario', 'conservacion' => 'Bueno', 'cantidad' => 10, 'fecha_alta' => '2024-04-16'],
        ['categoria' => 'A4', 'elemento' => 'Equipo de protección balística', 'unidad' => 'Segunda Compañía Rosario', 'conservacion' => 'Muy bueno', 'cantidad' => 5, 'fecha_alta' => '2025-01-29'],

        ['categoria' => 'A5', 'elemento' => 'Aspiradora', 'unidad' => 'Sede Escuela Superior', 'conservacion' => 'Bueno', 'cantidad' => 1, 'fecha_alta' => '2024-06-13'],
        ['categoria' => 'A5', 'elemento' => 'Hidrolavadora', 'unidad' => 'Logística', 'conservacion' => 'Regular', 'cantidad' => 1, 'fecha_alta' => '2025-07-21'],
        ['categoria' => 'A5', 'elemento' => 'Motosierra', 'unidad' => 'Primer Compañía Recreo', 'conservacion' => 'Malo', 'cantidad' => 1, 'fecha_alta' => '2025-10-02'],

        ['categoria' => 'A6', 'elemento' => 'Camioneta', 'unidad' => 'Administración y Finanzas', 'conservacion' => 'Bueno', 'cantidad' => 1, 'fecha_alta' => '2024-09-24'],
    ];

    public function run(): void
    {
        if (!filter_var(env('APP_SEED_DEMO_ITEMS', false), FILTER_VALIDATE_BOOL)) {
            return;
        }

        if (Movimiento::where('tipo', 'alta')->where('motivo', self::MOTIVO)->exists()) {
            $this->command?->info('Los items de demostracion ya estaban cargados.');

            return;
        }

        $responsable = User::orderBy('id')->first();

        if ($responsable === null) {
            $this->command?->warn('No hay usuarios: se omitieron los items de demostracion.');

            return;
        }

        DB::transaction(function () use ($responsable): void {
            foreach (self::ITEMS as $demo) {
                $this->crearItem($demo, $responsable);
            }
        });

        $this->command?->info('Items de demostracion creados: '.count(self::ITEMS));
    }

    private function crearItem(array $demo, User $responsable): void
    {
        $categoria = Categoria::where('codigo', $demo['categoria'])->firstOrFail();
        $tipo = TipoItem::where('categoria_id', $categoria->id)
            ->where('nombre', $demo['elemento'])
            ->firstOrFail();
        $unidad = Unidad::where('nombre', $demo['unidad'])->firstOrFail();

        $valores = [];
        foreach (CampoDinamico::where('tipo_item_id', $tipo->id)->where('activo', true)->orderBy('orden')->get() as $campo) {
            $valores[$campo->id] = $this->valorDemo($campo);
        }

        $codigo = $this->generarCodigo($categoria->codigo, $unidad);

        $item = Item::create([
            'codigo_unico' => $codigo,
            'categoria_id' => $categoria->id,
            'tipo_item_id' => $tipo->id,
            'responsable_id' => $responsable->id,
            'unidad_id' => $unidad->id,
            'estado_conservacion' => $demo['conservacion'],
            'cantidad' => $demo['cantidad'],
            'fecha_alta' => $demo['fecha_alta'],
            'valores_dinamicos' => $valores,
            'estado' => 'activo',
        ]);

        Movimiento::create([
            'item_id' => $item->id,
            'tipo' => 'alta',
            'unidad_origen_id' => $unidad->id,
            'unidad_destino_id' => null,
            'motivo' => self::MOTIVO,
            'estado' => 'aprobado',
            'solicitante_id' => $responsable->id,
            'validador_id' => null,
            'fecha_validacion' => now(),
        ]);

        Auditoria::create([
            'user_id' => $responsable->id,
            'accion' => 'crear',
            'entidad' => 'item',
            'entidad_id' => $item->id,
            'detalle' => [
                'codigo' => $codigo,
                'categoria' => $categoria->codigo,
                'tipo_item' => $tipo->nombre,
                'unidad' => $unidad->nombre,
                'responsable' => $responsable->name,
                'estado_conservacion' => $demo['conservacion'],
                'cantidad' => $demo['cantidad'],
                'origen' => 'demo',
            ],
        ]);
    }

    private function valorDemo(CampoDinamico $campo): string
    {
        if (is_array($campo->opciones) && $campo->opciones !== []) {
            return (string) $campo->opciones[0];
        }

        $fijos = [
            'Características' => 'Buen estado de conservacion, uso institucional',
            'Color' => 'Negro',
            'Medidas' => '60 x 60 x 75 cm',
            'Marca' => 'Generica',
            'Modelo' => 'MDL-2024',
            'Número de serie' => 'SN-00000001',
            'Procesador' => 'Intel Core i5',
            'RAM' => '16 GB',
            'Tamaño (pulgadas)' => '24',
            'Capacidad (BTU)' => '3500',
            'Capacidad (L)' => '300',
            'Capacidad (RPM)' => '1400',
            'Capacidad (W)' => '1500',
            'Capacidad (VA)' => '1500',
            'Potencia (W)' => '1200',
            'IMEI' => '356938035643809',
            'Calibre (MM)' => '9',
            'Numeración' => '0001',
            'Fecha de fabricación' => '2022',
            'Talla' => 'L',
            'Año' => '2022',
            'Dominio' => 'AB123CD',
            'Número de chasis' => 'CH-0000123',
            'Número de expediente' => 'EXP-2024-001',
            'Número de identificación' => 'ID-0001234',
            'Número de motor' => 'MOT-0001234',
        ];

        return $fijos[$campo->nombre] ?? 'Demo '.$campo->nombre;
    }

    private function generarCodigo(string $codigoCategoria, Unidad $unidad): string
    {
        $prefijo = sprintf('%s-%02d-%02d-', $codigoCategoria, $unidad->sede_id, $unidad->id);

        $ultimo = Item::where('codigo_unico', 'like', $prefijo.'%')
            ->orderByDesc('codigo_unico')
            ->value('codigo_unico');

        $nro = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return $prefijo.str_pad((string) $nro, 6, '0', STR_PAD_LEFT);
    }
}
