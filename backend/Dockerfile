FROM node:22-alpine AS frontend

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM php:8.3-fpm-alpine AS app

RUN apk add --no-cache \
        nginx \
        supervisor \
        libzip-dev \
        libpq-dev \
        icu-dev \
        oniguruma-dev \
        postgresql-client \
        && docker-php-ext-install -j"$(nproc)" \
            pdo_pgsql \
            pdo_mysql \
            zip \
            intl \
            mbstring \
            bcmath \
            opcache \
        && apk del libzip-dev libpq-dev icu-dev oniguruma-dev

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --no-interaction \
        --prefer-dist

COPY backend/ ./

COPY --from=frontend /build/frontend/dist ./public

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
