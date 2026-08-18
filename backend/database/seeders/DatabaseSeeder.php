<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Rol;
use App\Models\Sede;
use App\Models\Unidad;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRoles();
        $this->seedSedes();
        $this->seedUnidades();
        $this->seedCategorias();
        $this->call(EstructuraCategoriasSeeder::class);
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

    private function seedSedes(): void
    {
        $sedes = ['Rosario', 'Recreo', 'Reconquista', 'Rafaela', 'Murphy/Melincue', 'Provincial'];

        foreach ($sedes as $nombre) {
            Sede::firstOrCreate(['nombre' => $nombre]);
        }
    }

    private function seedUnidades(): void
    {
        $porSede = [
            'Rosario' => [
                'Escuela de Especialidades',
                'Escuela de Policía',
                'Escuela de Investigaciones',
                'Escuela Superior',
                'Área Inscripción Alumnado',
                'Cuerpo Escuela de Especialidades',
                'Cuerpo Escuela de Investigaciones',
                'Cuerpo Escuela de Policía',
                'Cuerpo Escuela Superior',
                'Dirección Escuela de Especialidades',
                'Dirección Escuela de Investigaciones',
                'Dirección Escuela de Policía',
                'Dirección Escuela Superior',
                'Dirección Programa de Formación Permanente',
                'Departamento Tecnología, Desarrollo e Innovación',
                'Educación a Distancia',
                'Estudio Escuela de Especialidades',
                'Estudio Escuela de Investigaciones',
                'Estudio Escuela de Policía',
                'Estudio Escuela Superior',
                'Secretaría Escuela de Especialidades',
                'Secretaría Escuela de Investigaciones',
                'Secretaría Escuela de Policía',
                'Secretaría Escuela Superior',
                'Sede Escuela Superior',
                'Sede Escuela Especialidades',
                'Subdirección General Escuela de Policía',
                'Primer Compañía Rosario',
                'Segunda Compañía Rosario',
                'Tercer Compañía Rosario',
                'Cuarta Compañía Rosario',
            ],
            'Recreo' => [
                'Secretaría Sede Recreo',
                'Primer Compañía Recreo',
                'Segunda Compañía Recreo',
                'Tercer Compañía Recreo',
                'Cuarta Compañía Recreo',
            ],
            'Reconquista' => [
                'Secretaría Sede Reconquista',
            ],
            'Rafaela' => [
                'Secretaría Sede Rafaela',
            ],
            'Murphy/Melincue' => [
                'Secretaría Sede Murphy',
            ],
            'Provincial' => [
                'Administración y Finanzas',
                'Asesoría Letrada General',
                'Departamento Psicopedagógico, Asistencia y Psicológico',
                'Dirección General',
                'División Archivo General',
                'Extensión Comunitaria',
                'Guardia de Prevención',
                'Logística',
                'Relaciones Policiales',
                'Sanidad',
                'Sección SARH',
                'Secretaría Académica',
                'Secretaría General',
                'Títulos y Certificaciones',
                'zDestino',
            ],
        ];

        foreach ($porSede as $sedeNombre => $unidades) {
            $sede = Sede::where('nombre', $sedeNombre)->firstOrFail();

            foreach ($unidades as $unidad) {
                Unidad::firstOrCreate(['nombre' => $unidad], ['sede_id' => $sede->id]);
            }
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
                'sede' => 'Rosario',
            ],
            [
                'name' => 'Jefe Sede Rosario',
                'email' => 'jefe@sagi.local',
                'dni' => '10000002',
                'username' => 'jefe',
                'password' => 'Jefe1234',
                'rol' => 'jefe',
                'sede' => 'Rosario',
            ],
            [
                'name' => 'Carga Sede Rosario',
                'email' => 'carga@sagi.local',
                'dni' => '10000003',
                'username' => 'carga',
                'password' => 'Carga1234',
                'rol' => 'carga',
                'sede' => 'Rosario',
            ],
            [
                'name' => 'Consulta Sede Rosario',
                'email' => 'consulta@sagi.local',
                'dni' => '10000004',
                'username' => 'consulta',
                'password' => 'Consulta1234',
                'rol' => 'consulta',
                'sede' => 'Rosario',
            ],
            [
                'name' => 'Prueba Flexible',
                'email' => 'prueba@sagi.local',
                'dni' => '10000005',
                'username' => 'prueba',
                'password' => 'Prueba1234',
                'rol' => 'carga',
                'sede' => 'Murphy/Melincue',
            ],
        ];

        foreach ($usuarios as $usuario) {
            $rol = Rol::where('slug', $usuario['rol'])->firstOrFail();
            $sede = Sede::where('nombre', $usuario['sede'])->firstOrFail();

            User::firstOrCreate(
                ['username' => $usuario['username']],
                [
                    'name' => $usuario['name'],
                    'email' => $usuario['email'],
                    'dni' => $usuario['dni'],
                    'password' => $usuario['password'],
                    'rol_id' => $rol->id,
                    'sede_id' => $sede->id,
                ]
            );
        }
    }
}