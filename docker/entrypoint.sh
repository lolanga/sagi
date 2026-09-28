#!/bin/sh
set -e

# Railway inyecta DATABASE_URL (formato postgres://usuario:clave@host:puerto/bd).
# Se expande a las variables DB_* que espera Laravel, escribiendolas en un archivo
# que este shell carga con `set -a` (el export de `php -r` dying en un subshell).
if [ -n "$DATABASE_URL" ]; then
    echo "[entrypoint] Detectada DATABASE_URL, expandiendo variables de conexion..."
    PHP_INPUT_URL="$DATABASE_URL" php -r '
        $url = parse_url(getenv("PHP_INPUT_URL"));
        if (!isset($url["host"])) {
            fwrite(STDERR, "DATABASE_URL no tiene host\n");
            exit(1);
        }
        $pairs = [
            "DB_CONNECTION" => str_contains($url["scheme"] ?? "", "mysql") ? "mysql" : "pgsql",
            "DB_HOST" => $url["host"],
            "DB_PORT" => (string) ($url["port"] ?? 5432),
            "DB_DATABASE" => ltrim($url["path"] ?? "", "/"),
            "DB_USERNAME" => isset($url["user"]) ? rawurldecode($url["user"]) : "",
            "DB_PASSWORD" => isset($url["pass"]) ? rawurldecode($url["pass"]) : "",
        ];
        $lineas = "";
        foreach ($pairs as $clave => $valor) {
            $lineas .= $clave . "=" . escapeshellarg($valor) . "\n";
        }
        file_put_contents("/tmp/db_env", $lineas);
    '

    set -a
    . /tmp/db_env
    set +a
    rm -f /tmp/db_env
fi

if [ -z "$DB_CONNECTION" ]; then
    DB_CONNECTION=pgsql
    export DB_CONNECTION
fi

if [ "$DB_CONNECTION" = "mysql" ]; then
    echo "[entrypoint] Esperando MySQL en $DB_HOST:$DB_PORT..."
else
    echo "[entrypoint] Esperando $DB_CONNECTION en $DB_HOST:$DB_PORT..."
fi

ATTEMPTS=0
until php -r "
\$driver = getenv('DB_CONNECTION') === 'mysql' ? 'mysql' : 'pgsql';
\$dsn = \$driver === 'mysql'
    ? 'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: 3306) . ';dbname=' . getenv('DB_DATABASE')
    : 'pgsql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: 5432) . ';dbname=' . getenv('DB_DATABASE');
try {
    new PDO(\$dsn, getenv('DB_USERNAME'), getenv('DB_PASSWORD'), [PDO::ATTR_TIMEOUT => 3]);
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge 30 ]; then
        echo "[entrypoint] Base de datos no disponible tras 30 intentos"
        exit 1
    fi
    sleep 2
done

echo "[entrypoint] Base de datos conectada. Ejecutando migraciones..."
php artisan migrate --force --no-interaction

echo "[entrypoint] Limpiando cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[entrypoint] Sincronizando permisos..."
chown -R www-data:www-data storage bootstrap/cache

echo "[entrypoint] Listo."
exec "$@"
