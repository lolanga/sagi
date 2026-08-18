<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\CampoDinamico;
use App\Models\Categoria;
use App\Models\Rol;
use App\Models\TipoItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRoles();
        $this->seedAreas();
        $this->seedCategorias();
        $this->seedTiposItems();
        $this->seedUsuarios();
    }

    private function seedRoles(): void
    {
        $roles = [
            ['nombre' => 'Administrador del sistema', 'slug' => 'admin'],
            ['nombre' => 'Jefe de área', 'slug' => 'jefe'],
            ['nombre' => 'Personal de carga', 'slug' => 'carga'],
            ['nombre' => 'Personal de consulta', 'slug' => 'consulta'],
        ];

        foreach ($roles as $rol) {
            Rol::firstOrCreate(['slug' => $rol['slug']], $rol);
        }
    }

    private function seedAreas(): void
    {
        $areas = ['Área Norte', 'Área Sur'];

        foreach ($areas as $nombre) {
            Area::firstOrCreate(['nombre' => $nombre]);
        }
    }

    private function seedCategorias(): void
    {
        $categorias = [
            ['codigo' => 'A1', 'nombre' => 'Amoblamiento y útiles', 'es_transitoria' => false],
            ['codigo' => 'A2', 'nombre' => 'Artefactos eléctricos', 'es_transitoria' => false],
            ['codigo' => 'A3', 'nombre' => 'Equipo de radiocomunicación, telefonía e informática', 'es_transitoria' => false],
            ['codigo' => 'A4', 'nombre' => 'Armamento, municiones y equipo de protección personal y balística', 'es_transitoria' => false],
            ['codigo' => 'A5', 'nombre' => 'Máquinas y herramientas', 'es_transitoria' => false],
            ['codigo' => 'A6', 'nombre' => 'Vehículos', 'es_transitoria' => false],
            ['codigo' => 'A7', 'nombre' => 'Altas', 'es_transitoria' => true],
            ['codigo' => 'A8', 'nombre' => 'Bajas', 'es_transitoria' => true],
        ];

        foreach ($categorias as $categoria) {
            Categoria::firstOrCreate(['codigo' => $categoria['codigo']], $categoria);
        }

        $this->seedCamposDinamicos();
    }

    private function seedCamposDinamicos(): void
    {
        $campos = [
            'A1' => [
                ['nombre' => 'Material', 'tipo' => 'texto'],
                ['nombre' => 'Color', 'tipo' => 'texto'],
                ['nombre' => 'Medidas', 'tipo' => 'texto'],
                ['nombre' => 'Detalles', 'tipo' => 'textarea'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
            'A2' => [
                ['nombre' => 'Marca', 'tipo' => 'texto'],
                ['nombre' => 'Modelo', 'tipo' => 'texto'],
                ['nombre' => 'N° de serie', 'tipo' => 'texto'],
                ['nombre' => 'Potencia o capacidad', 'tipo' => 'texto'],
                ['nombre' => 'Detalle', 'tipo' => 'textarea'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
            'A3' => [
                ['nombre' => 'Tipo de equipo', 'tipo' => 'texto'],
                ['nombre' => 'Modo de conexión', 'tipo' => 'select', 'opciones' => ['Cableado', 'Wifi', 'Red', 'Otro']],
                ['nombre' => 'Sistema operativo', 'tipo' => 'texto'],
                ['nombre' => 'Dirección IP/MAC', 'tipo' => 'texto'],
                ['nombre' => 'Marca', 'tipo' => 'texto'],
                ['nombre' => 'Modelo', 'tipo' => 'texto'],
                ['nombre' => 'N° de serie', 'tipo' => 'texto'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
            'A4' => [
                ['nombre' => 'Tipo', 'tipo' => 'select', 'opciones' => ['Arma', 'Munición', 'Equipo de protección']],
                ['nombre' => 'Calibre', 'tipo' => 'texto'],
                ['nombre' => 'N° de registro', 'tipo' => 'texto'],
                ['nombre' => 'Talla', 'tipo' => 'texto'],
                ['nombre' => 'Estado', 'tipo' => 'texto'],
                ['nombre' => 'Detalle', 'tipo' => 'textarea'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'Fecha de fabricación', 'tipo' => 'fecha'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
            'A5' => [
                ['nombre' => 'Marca', 'tipo' => 'texto'],
                ['nombre' => 'Modelo', 'tipo' => 'texto'],
                ['nombre' => 'N° de serie', 'tipo' => 'texto'],
                ['nombre' => 'Potencia', 'tipo' => 'texto'],
                ['nombre' => 'Detalle', 'tipo' => 'textarea'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
            'A6' => [
                ['nombre' => 'Tipo de vehículo', 'tipo' => 'select', 'opciones' => ['Auto', 'Camioneta', 'Moto', 'Camión', 'Otro']],
                ['nombre' => 'Marca', 'tipo' => 'texto'],
                ['nombre' => 'Modelo', 'tipo' => 'texto'],
                ['nombre' => 'Patente', 'tipo' => 'texto'],
                ['nombre' => 'Año', 'tipo' => 'numero'],
                ['nombre' => 'Color', 'tipo' => 'texto'],
                ['nombre' => 'N° de chasis/motor', 'tipo' => 'texto'],
                ['nombre' => 'Combustible', 'tipo' => 'texto'],
                ['nombre' => 'N° identificatorio', 'tipo' => 'texto'],
                ['nombre' => 'Economía de consumo', 'tipo' => 'texto'],
                ['nombre' => 'Procedencia', 'tipo' => 'texto'],
                ['nombre' => 'N° de expediente', 'tipo' => 'texto'],
                ['nombre' => 'Cantidad', 'tipo' => 'numero'],
            ],
        ];

        foreach ($campos as $codigo => $camposList) {
            $categoria = Categoria::where('codigo', $codigo)->first();
            if (!$categoria) {
                continue;
            }

            foreach ($camposList as $orden => $campo) {
                CampoDinamico::firstOrCreate(
                    ['categoria_id' => $categoria->id, 'nombre' => $campo['nombre']],
                    [
                        'tipo' => $campo['tipo'],
                        'opciones' => $campo['opciones'] ?? null,
                        'requerido' => false,
                        'activo' => true,
                        'orden' => $orden,
                    ]
                );
            }
        }
    }

    private function seedTiposItems(): void
    {
        $tipos = [
            'A1' => ['Mesa', 'Silla', 'Sillón', 'Estantería', 'Escritorio', 'Archivador', 'Útil'],
            'A2' => ['Ventilador', 'Aire acondicionado', 'Heladera', 'Microondas', 'Plancha', 'Termo eléctrico'],
            'A3' => ['Radio', 'Handy', 'Teléfono', 'PC de escritorio', 'Notebook', 'Monitor', 'Impresora', 'Cámara', 'Router', 'Switch'],
            'A4' => ['Pistola', 'Revólver', 'Escopeta', 'Munición 9mm', 'Munición .38', 'Chaleco antibalas', 'Casco', 'Escudo', 'Máscara antigás'],
            'A5' => ['Taladro', 'Amoladora', 'Soldadora', 'Compresora', 'Generador', 'Juego de herramientas'],
            'A6' => ['Auto', 'Camioneta', 'Moto', 'Camión', 'Bicicleta'],
        ];

        foreach ($tipos as $codigo => $nombres) {
            $categoria = Categoria::where('codigo', $codigo)->first();
            if (!$categoria) {
                continue;
            }

            foreach ($nombres as $orden => $nombre) {
                TipoItem::firstOrCreate(
                    ['categoria_id' => $categoria->id, 'nombre' => $nombre],
                    ['orden' => $orden]
                );
            }
        }
    }

    private function seedUsuarios(): void
    {
        $usuarios = [
            [
                'name' => 'Admin Sistema',
                'email' => 'admin@sagi.local',
                'dni' => '10000001',
                'username' => 'admin',
                'password' => 'Admin1234',
                'rol' => 'admin',
                'area' => 'Área Norte',
            ],
            [
                'name' => 'Jefe Área Norte',
                'email' => 'jefe@sagi.local',
                'dni' => '10000002',
                'username' => 'jefe',
                'password' => 'Jefe1234',
                'rol' => 'jefe',
                'area' => 'Área Norte',
            ],
            [
                'name' => 'Carga Área Norte',
                'email' => 'carga@sagi.local',
                'dni' => '10000003',
                'username' => 'carga',
                'password' => 'Carga1234',
                'rol' => 'carga',
                'area' => 'Área Norte',
            ],
            [
                'name' => 'Consulta Área Norte',
                'email' => 'consulta@sagi.local',
                'dni' => '10000004',
                'username' => 'consulta',
                'password' => 'Consulta1234',
                'rol' => 'consulta',
                'area' => 'Área Norte',
            ],
            [
                'name' => 'Prueba Flexible',
                'email' => 'prueba@sagi.local',
                'dni' => '10000005',
                'username' => 'prueba',
                'password' => 'Prueba1234',
                'rol' => 'carga',
                'area' => 'Área Sur',
            ],
        ];

        foreach ($usuarios as $usuario) {
            $rol = Rol::where('slug', $usuario['rol'])->firstOrFail();
            $area = Area::where('nombre', $usuario['area'])->firstOrFail();

            User::firstOrCreate(
                ['username' => $usuario['username']],
                [
                    'name' => $usuario['name'],
                    'email' => $usuario['email'],
                    'dni' => $usuario['dni'],
                    'password' => $usuario['password'],
                    'rol_id' => $rol->id,
                    'area_id' => $area->id,
                ]
            );
        }
    }
}
