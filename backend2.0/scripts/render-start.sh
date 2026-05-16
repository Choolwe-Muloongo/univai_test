#!/usr/bin/env bash
set -euo pipefail

php artisan config:clear
php artisan cache:clear
php artisan migrate --force
php artisan config:cache

php artisan serve --host 0.0.0.0 --port "${PORT:-8000}"
