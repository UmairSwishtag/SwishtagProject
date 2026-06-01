#!/usr/bin/env bash

echo "Running deployment script..."

# Generate application key if not set
php artisan key:generate --force --no-interaction

# Clear and cache configuration
php artisan config:clear
php artisan cache:clear

# Run database migrations
php artisan migrate --force --no-interaction

# Create storage symlink if it doesn't exist
php artisan storage:link --quiet || true

# Cache configurations for better performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Deployment complete!"
