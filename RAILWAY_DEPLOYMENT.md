# Railway Deployment Guide

This guide will help you deploy your Laravel Shopify application to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Git installed and your project committed to a Git repository
3. GitHub, GitLab, or Bitbucket account (Railway connects to these)

## Files Added for Railway Deployment

The following files have been created/modified for Railway deployment:

- `Procfile` - Defines the web process for Railway (uses railway-start.sh)
- `nixpacks.toml` - Configuration for Nixpacks build system
- `railway.json` - Railway-specific deployment configuration (healthcheck at /up)
- `railway-start.sh` - **NEW:** Startup script that handles migrations, caching, and server start
- `deploy.sh` - Alternative deployment script for manual use
- `.env.example` - Updated with Railway-friendly defaults
- `.env.railway` - Production environment template
- `composer.json` - Added deployment scripts
- `HEALTHCHECK_TROUBLESHOOTING.md` - **NEW:** Comprehensive healthcheck debugging guide

## Deployment Steps

### 1. Push Your Code to Git Repository

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Create a New Project on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 3. Add a Database (Required)

#### Option A: PostgreSQL (Recommended)
1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

#### Option B: MySQL
1. In your Railway project, click "New"
2. Select "Database" → "Add MySQL"
3. Railway will automatically set database environment variables

### 4. Add Redis (Optional, but recommended for queues)

1. In your Railway project, click "New"
2. Select "Database" → "Add Redis"
3. Railway will automatically set `REDIS_URL` environment variable

### 5. Configure Environment Variables

In Railway dashboard, go to your service → "Variables" tab and add:

#### Required Variables:
```
APP_NAME=YourAppName
APP_ENV=production
APP_KEY=    # CRITICAL: Generate with: php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://your-app.railway.app
```

⚠️ **IMPORTANT:** APP_KEY is REQUIRED! Generate it locally:
```bash
php artisan key:generate --show
# Copy the output (including "base64:") to Railway Variables
```

Without APP_KEY, your deployment will fail!

#### Database Variables (if using PostgreSQL):
```
DB_CONNECTION=pgsql
```

Railway automatically provides: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

#### Queue Configuration:
```
QUEUE_CONNECTION=database
```

Or if you added Redis:
```
QUEUE_CONNECTION=redis
```

#### Shopify Configuration:
```
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_API_VERSION=2025-04
SHOPIFY_API_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_locations,read_inventory
SHOPIFY_APPBRIDGE_ENABLED=0
SHOPIFY_BILLING_ENABLED=0
```

Update webhook URLs with your Railway URL:
```
SHOPIFY_WEBHOOK_1_TOPIC=app/uninstalled
SHOPIFY_WEBHOOK_1_ADDRESS=https://your-app.railway.app/webhook/app-uninstalled

SHOPIFY_WEBHOOK_2_TOPIC=products/create
SHOPIFY_WEBHOOK_2_ADDRESS=https://your-app.railway.app/webhook/products-create

SHOPIFY_WEBHOOK_3_TOPIC=products/delete
SHOPIFY_WEBHOOK_3_ADDRESS=https://your-app.railway.app/webhook/products-delete

SHOPIFY_WEBHOOK_4_TOPIC=products/update
SHOPIFY_WEBHOOK_4_ADDRESS=https://your-app.railway.app/webhook/products-update

SHOPIFY_WEBHOOK_5_TOPIC=orders/create
SHOPIFY_WEBHOOK_5_ADDRESS=https://your-app.railway.app/webhook/orders-create

SHOPIFY_WEBHOOK_6_TOPIC=orders/delete
SHOPIFY_WEBHOOK_6_ADDRESS=https://your-app.railway.app/webhook/orders-delete

SHOPIFY_WEBHOOK_7_TOPIC=orders/updated
SHOPIFY_WEBHOOK_7_ADDRESS=https://your-app.railway.app/webhook/orders-updated
```

#### Other Configuration:
```
SESSION_DRIVER=database
CACHE_STORE=database
LOG_CHANNEL=stack
MAIL_MAILER=log
```

### 6. Deploy
**⚠️ Common Deployment Issues:**
- If healthcheck fails, see `HEALTHCHECK_TROUBLESHOOTING.md`
- Ensure APP_KEY is set before deploying
- Check that database service is running

### 7. Monitor First Deployment

1. Watch the build logs for any errors
2. Watch the deploy logs - should see:
   ```
   🚀 Starting Railway deployment...
   📊 Running database migrations...
   ✅ Deployment preparation complete!
   🌐 Starting web server...
   ```
3. Healthcheck should pass within 1-2 minutes

### 8. If Healthcheck Fails

See the comprehensive guide: [HEALTHCHECK_TROUBLESHOOTING.md](HEALTHCHECK_TROUBLESHOOTING.md)

Quick checks:
1. ✅ APP_KEY is set
2. ✅ Database service is running
3. ✅ DB_CONNECTION matches your database type (pgsql/mysql)
4. ✅ Check deploy logs for specific errors
# Run migrations
railway run php artisan migrate --force
```

### 8. Update Shopify App URL

1. Go to your Shopify Partner Dashboard
2. Update your app's URL to your Railway URL
3. Update allowed redirection URLs

## Post-Deployment

### Monitor Logs
View logs in Railway dashboard under "Deployments" → Click on deployment → "View Logs"

### Run Artisan Commands
Use Railway CLI:
```bash
railway run php artisan cache:clear
railway run php artisan config:cache
railway run php artisan queue:work
```

### Set Up Queue Workers (If Using Queues)

Create a new service in Railway for queue workers:

1. Add a new service from the same repository
2. Change the start command to: `php artisan queue:work --tries=3`
3. Use the same environment variables

## Important Notes

1. **Storage**: Railway uses ephemeral storage. Files uploaded to `storage/app/public` will be lost on redeployment. Consider using AWS S3 or similar for persistent file storage.

2. **Database Backups**: Set up regular database backups through Railway's backup feature.

3. **Environment Variables**: Never commit `.env` file to Git. Always use Railway's environment variables.

4. **APP_KEY**: Generate a unique APP_KEY for production. Never use the same key as local development.

5. **HTTPS**: Railway provides HTTPS by default. Make sure `APP_URL` uses `https://`

## Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `composer.json` and `package.json`
- Verify `nixpacks.toml` configuration

### Database Connection Issues
- Verify `DB_CONNECTION` matches your database type
- Check that Railway's database variables are correctly set
- Ensure database service is running

### 500 Errors
- Check application logs in Railway
- Verify `APP_KEY` is set
- Run `php artisan config:clear` via Railway CLI
- Check file permissions (though less common on Railway)

### Webhook Issues
- Verify webhook URLs in environment variables
- Check Shopify app settings for correct URLs
- Review webhook logs in Shopify Partner Dashboard

## Scaling

Railway allows you to scale your application:
- Increase memory/CPU in service settings
- Add multiple instances (requires stateless sessions)
- Use Redis for session management when scaling horizontally

## Cost Optimization

- Use Railway's free tier for development
- Monitor resource usage in dashboard
- Optimize database queries and caching
- Consider upgrading to paid plan for production apps

---

For more information, visit [Railway Documentation](https://docs.railway.app/)
