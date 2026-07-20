FROM php:8.4-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev libzip-dev libicu-dev unzip \
    && docker-php-ext-install pdo_pgsql zip intl bcmath pcntl posix sockets opcache \
    && rm -rf /var/lib/apt/lists/*

# OPcache tuning. Critical here: `artisan serve` is a CLI process and PHP turns
# OPcache off for CLI by default, so without this every request recompiles the
# whole framework — see docker/opcache.ini for the measurements.
COPY docker/opcache.ini /usr/local/etc/php/conf.d/zz-opcache.ini

# Composer for in-container package management
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
