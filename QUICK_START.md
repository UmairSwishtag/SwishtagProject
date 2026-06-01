# Railway Quick Start Guide

## 🚀 Deploy in 5 Steps

### 1. Push to Git
```bash
git add .
git commit -m "Add Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### 3. Add Database
- Click "New" → "Database" → "Add PostgreSQL"

### 4. Set Environment Variables
In Railway Dashboard → Variables → Add these:

```
APP_NAME=YourAppName
APP_ENV=production
APP_KEY=YOUR_GENERATED_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app.railway.app
DB_CONNECTION=pgsql
QUEUE_CONNECTION=database
SESSION_DRIVER=database
CACHE_STORE=database

SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_API_VERSION=2025-04
SHOPIFY_API_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_locations,read_inventory

# Update webhooks with your Railway URL
SHOPIFY_WEBHOOK_1_TOPIC=app/uninstalled
SHOPIFY_WEBHOOK_1_ADDRESS=https://your-app.railway.app/webhook/app-uninstalled
# ... (add remaining webhooks)
```

**Generate APP_KEY:**
```bash
php artisan key:generate --show
```

### 5. Run Migrations
Install Railway CLI and run:
```bash
npm i -g @railway/cli
railway login
railway link
railway run php artisan migrate --force
```

## ✅ Done!
Visit your Railway URL to test your app.

---

📖 **For detailed instructions, see:** `RAILWAY_DEPLOYMENT.md`  
✔️ **For complete checklist, see:** `DEPLOYMENT_CHECKLIST.md`  
📝 **For all changes made, see:** `DEPLOYMENT_SUMMARY.md`
