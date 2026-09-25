#!/bin/sh
set -e

echo "[entrypoint]等待 Postgres..."
ATTEMPTS=0
until php -r "
try {
    new PDO(
        'pgsql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: 5432) . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD'),
        [PDO::ATTR_TIMEOUT => 3]
    );
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge 30 ]; then
        echo "[entrypoint] DB no disponible tras 30 intentos"
        exit 1
    fi
    sleep 2
done

echo "[entrypoint] DB conectada. Ejecutando migraciones..."
php artisan migrate --force --no-interaction

echo "[entrypoint] Limpiando cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[entrypoint] Sincronizando permisos..."
chown -R www-data:www-data storage bootstrap/cache

echo "[entrypoint] Listo."
exec "$@"
