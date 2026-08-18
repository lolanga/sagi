# SAGI – Sistema de Administración y Gestión de Inventarios

Inventario, Registro y Control de equipos y mobiliario del Instituto de Seguridad Pública (ISeP).

## Estructura

```
sagi/
├── backend/   # API REST en Laravel (PHP 8.2+)
└── frontend/  # SPA en React + Vite (CSS puro)
```

## Requisitos

- XAMPP con Apache + MySQL + PHP 8.2 (con extensión `zip` habilitada)
- Composer
- Node.js 18+

## Instalación (desarrollo local)

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
# Configurar DB en .env: DB_DATABASE=sagi, DB_USERNAME=root, DB_PASSWORD=
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.

## Usuarios de prueba

| Rol | Usuario (DNI) | Clave |
|---|---|---|
| Administrador | 10000001 | Admin1234 |
| Jefe de área | 10000002 | Jefe1234 |
| Personal de carga | 10000003 | Carga1234 |
| Personal de consulta | 10000004 | Consulta1234 |
| Prueba flexible | 10000005 | Prueba1234 |

## Documentación

- `SAGI-Especificaciones-Funcionales.md`
- `SAGI-Especificaciones-Tecnicas.md`
- `SAGI-Plan-de-Implementacion.md`