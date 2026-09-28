# Deploy en Railway

## Por que Railway y no Vercel / Supabase

- **Vercel** no tiene runtime PHP. El proyecto es Laravel 12.
- **Supabase** no es un runtime PHP: es Postgres + PostgREST + Deno. Habria que
  reescribir los 11 controllers y mover la autorizacion de PHP a RLS.

Railway corre PHP nativo via Docker, asi que el codigo Laravel no cambia.

## Estructura del deploy

Un solo servicio sirve la SPA y la API:

```
Railway  ->  nginx (:80)
               |-- /            -> public/index.html  (build de Vite)
               |-- /assets/*     -> cache inmutable 1 año
               |-- /api/*        -> public/index.php   (Laravel)
               \-- php-fpm (:9000)
                      |
                      +-> Postgres (plugin Railway)
```

`frontend/src/services/api.js` usa `baseURL: '/api'`, asi que al servir todo en el
mismo origen **no hace falta CORS**.

## Pasos

### 1. Crear el proyecto

1. New Project -> Deploy from GitHub repo -> `lolanga/sagi`.
2. Railway detecta `railway.json` y usa `backend/Dockerfile`.

### 2. Agregar Postgres

1. New -> Database -> Postgres.
2. Railway genera `DATABASE_URL` automaticamente.

### 3. Variables de entorno

En el servicio:

```
APP_ENV=production
APP_DEBUG=false
APP_KEY=            <- generar con: php artisan key:generate --show
APP_URL=https://<tu-servicio>.up.railway.app

DB_CONNECTION=pgsql

APP_LOCALE=es
APP_FALLBACK_LOCALE=es
```

`SESSION_DRIVER`, `CACHE_STORE` y `QUEUE_CONNECTION` quedan en `database`
(ya es el default de `.env.example`), suficiente para este volumen.

`APP_KEY` se puede generar local:

```
cd backend
C:\xampp\php\php.exe artisan key:generate --show
```

### 4. Seed (solo la primera vez, en una terminal de Railway)

Antes de correr el seed, definir `APP_ADMIN_USERNAME`, `APP_ADMIN_DNI` y
`APP_ADMIN_PASSWORD` (dejar `APP_SEED_DEMO_USERS=false` para no crear los
usuarios de prueba).

```
php artisan db:seed --force
```

## Comandos utiles

```bash
# Ver logs
railway logs

# Reiniciar
railway up

# Redeploy tras cambiar variables
railway up --detach
```

## Notas

- Las migraciones corren solas en cada deploy (`migrate --force` en el entrypoint).
- El Dockerfile corre `composer install --no-dev`, asi que `php artisan tinker`
  no esta disponible en produccion.
- **Conexion a la base:** si el plugin Postgres de Railway genera `DATABASE_URL`,
  el `entrypoint.sh` la expande a `DB_HOST`, `DB_PORT`, `DB_DATABASE`,
  `DB_USERNAME` y `DB_PASSWORD` antes de migrar. Si las variables `DB_*` ya estan
  cargadas manualmente, se respetan tal cual.
- **Usuarios de prueba:** `APP_SEED_DEMO_USERS` viene en `false` en `.env.example`,
  por lo que `db:seed` **no** crea `admin/Admin1234`, `jefe/Jefe1234`, etc.
  Para el primer acceso real hay que definir `APP_ADMIN_USERNAME`, `APP_ADMIN_DNI`
  y `APP_ADMIN_PASSWORD` antes de correr el seed; se crea un unico administrador.
  Luego se cambia la clave desde la aplicacion.
- **Items de ejemplo:** `APP_SEED_DEMO_ITEMS` (en `false` por defecto) carga 20
  items repartidos en A1-A6, con sus movimientos de alta y su auditoria. Es idempotente:
  si ya hay items de demo no vuelve a crear. Solo para entornos de prueba.
- **Respaldo:** `DashboardController::backup()` detecta el motor activo y usa
  `pg_dump` en PostgreSQL o `mysqldump` en MySQL. En Railway el disco es efimero,
  asi que el archivo se genera en memoria y se descarga; para copias periodicas
  conviene el backup automatico de Railway.
- Si el trafico crece, agregar el plugin Redis y mover `CACHE_STORE` / `QUEUE_CONNECTION`
  a `redis`.

## Pendientes antes de publicar

- [ ] Integrar el login real del ISeP en `AuthController` (hoy valida contra los
      usuarios locales de SAGI con hash; no hay verificacion contra el servidor
      institucional).
- [ ] Paginar `/api/reportes/items`: hoy devuelve todos los items sin limite.
- [ ] Revisar indices para la busqueda sobre `valores_dinamicos` (JSONB).
- [ ] Definir expiracion de tokens en `config/sanctum.php` (hoy es `null`).
