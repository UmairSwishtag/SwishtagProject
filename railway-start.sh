#!/bin/bash
set -e

echo "🚀 Starting Railway deployment..."

# Check if APP_KEY is set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    echo "⚠️  APP_KEY not set, generating..."
    php artisan key:generate --force --no-interaction
fi

# Run migrations
echo "📊 Running database migrations..."
php artisan migrate --force --no-interaction || {
    echo "⚠️  Migration failed, but continuing..."
}

# Create storage link
echo "🔗 Creating storage symlink..."
php artisan storage:link --force || true

# Clear any stale cache
echo "🧹 Clearing cache..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Cache for production (only if no errors)
echo "⚡ Caching configuration..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "✅ Deployment preparation complete!"
echo "🌐 Starting web server on port $PORT..."

# Start the Laravel server
exec php artisan serve --host=0.0.0.0 --port=$PORT
