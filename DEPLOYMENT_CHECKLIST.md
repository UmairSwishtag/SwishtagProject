# Railway Deployment Checklist

## Before Deployment

- [ ] All code committed to Git repository
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] Dependencies are in `composer.json` and `package.json`
- [ ] Database migrations are up to date
- [ ] APP_KEY is not hardcoded (will generate on Railway)

## Railway Setup

- [ ] Create Railway account
- [ ] Connect GitHub/GitLab/Bitbucket account
- [ ] Create new Railway project from your repository

## Database Setup

Choose one:
- [ ] PostgreSQL database added to project (recommended)
- [ ] MySQL database added to project

Optional:
- [ ] Redis added for caching and queues

## Environment Variables (Set in Railway Dashboard)

Required:
- [ ] `APP_NAME` - Your application name
- [ ] `APP_ENV=production`
- [ ] `APP_KEY` - Generate with `php artisan key:generate --show`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` - Your Railway URL (e.g., https://your-app.railway.app)

Database (if using PostgreSQL):
- [ ] `DB_CONNECTION=pgsql`
- [ ] Railway auto-sets: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

Queue:
- [ ] `QUEUE_CONNECTION=database` (or `redis` if Redis added)

Shopify:
- [ ] `SHOPIFY_API_KEY` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_API_SECRET` - From Shopify Partner Dashboard
- [ ] `SHOPIFY_API_VERSION=2025-04`
- [ ] `SHOPIFY_API_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_locations,read_inventory`
- [ ] `SHOPIFY_APPBRIDGE_ENABLED=0` (or 1 if embedded)
- [ ] `SHOPIFY_BILLING_ENABLED=0` (or 1 if billing enabled)

Webhook URLs (replace with your Railway URL):
- [ ] `SHOPIFY_WEBHOOK_1_TOPIC=app/uninstalled`
- [ ] `SHOPIFY_WEBHOOK_1_ADDRESS=https://your-app.railway.app/webhook/app-uninstalled`
- [ ] `SHOPIFY_WEBHOOK_2_TOPIC=products/create`
- [ ] `SHOPIFY_WEBHOOK_2_ADDRESS=https://your-app.railway.app/webhook/products-create`
- [ ] `SHOPIFY_WEBHOOK_3_TOPIC=products/delete`
- [ ] `SHOPIFY_WEBHOOK_3_ADDRESS=https://your-app.railway.app/webhook/products-delete`
- [ ] `SHOPIFY_WEBHOOK_4_TOPIC=products/update`
- [ ] `SHOPIFY_WEBHOOK_4_ADDRESS=https://your-app.railway.app/webhook/products-update`
- [ ] `SHOPIFY_WEBHOOK_5_TOPIC=orders/create`
- [ ] `SHOPIFY_WEBHOOK_5_ADDRESS=https://your-app.railway.app/webhook/orders-create`
- [ ] `SHOPIFY_WEBHOOK_6_TOPIC=orders/delete`
- [ ] `SHOPIFY_WEBHOOK_6_ADDRESS=https://your-app.railway.app/webhook/orders-delete`
- [ ] `SHOPIFY_WEBHOOK_7_TOPIC=orders/updated`
- [ ] `SHOPIFY_WEBHOOK_7_ADDRESS=https://your-app.railway.app/webhook/orders-updated`

Session & Cache:
- [ ] `SESSION_DRIVER=database`
- [ ] `CACHE_STORE=database` (or `redis` if Redis added)

## First Deployment

- [ ] Railway automatically deploys on push
- [ ] Check build logs for errors
- [ ] Verify deployment status is "Success"

## Post-Deployment Tasks

- [ ] Install Railway CLI: `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link`
- [ ] Run migrations: `railway run php artisan migrate --force`
- [ ] Test application: Visit your Railway URL
- [ ] Check logs for errors

## Shopify Configuration

- [ ] Update app URL in Shopify Partner Dashboard
- [ ] Update allowed redirection URLs
- [ ] Test Shopify OAuth flow
- [ ] Verify webhooks are registered

## Optional but Recommended

- [ ] Set up queue worker as separate service
- [ ] Configure automatic backups
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain
- [ ] Enable Railway's health checks

## Verification

- [ ] App loads successfully
- [ ] Database connection works
- [ ] Shopify OAuth works
- [ ] Webhooks are receiving data
- [ ] Products sync correctly
- [ ] Orders sync correctly
- [ ] No errors in Railway logs

## Production Considerations

- [ ] Switch `APP_DEBUG` to `false`
- [ ] Use strong `APP_KEY`
- [ ] Set up file storage (S3/CloudFlare R2) for persistent files
- [ ] Configure email service (if needed)
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Review security headers
- [ ] Set up SSL (Railway provides this automatically)

## Maintenance

- [ ] Schedule database backups
- [ ] Monitor resource usage
- [ ] Review logs regularly
- [ ] Keep dependencies updated
- [ ] Test before pushing to production

---

**Quick Deploy Command:**
```bash
git add .
git commit -m "Deployment commit"
git push origin main
```

**Run Migrations:**
```bash
railway run php artisan migrate --force
```

**View Logs:**
```bash
railway logs
```
