# Railway Healthcheck Failure - Troubleshooting Guide

## ✅ Issues Fixed

### 1. Healthcheck Path Mismatch
**Problem:** Railway was checking `/health` but Laravel uses `/up`  
**Solution:** Updated `railway.json` to use `/up`

### 2. Build-Time Caching Issues
**Problem:** Config/route/view caching during build requires database and APP_KEY  
**Solution:** Moved caching to runtime startup script

### 3. Missing Startup Script
**Problem:** No proper initialization before server starts  
**Solution:** Created `railway-start.sh` to handle migrations and setup

## 🔍 Common Causes of Healthcheck Failures

### 1. Missing APP_KEY ⚠️ MOST COMMON
**Symptom:** App fails to start, 500 errors  
**Solution:**
```bash
# Generate a key locally
php artisan key:generate --show

# Add to Railway environment variables
APP_KEY=base64:your-generated-key-here
```

### 2. Database Connection Issues
**Symptom:** App tries to connect to database during startup and fails  
**Solution:**
- Ensure PostgreSQL or MySQL is added to your Railway project
- Check `DB_CONNECTION` is set correctly (`pgsql` or `mysql`)
- Railway auto-provides `DATABASE_URL` - don't override it

**Environment Variables:**
```bash
DB_CONNECTION=pgsql
# Railway provides: DATABASE_URL, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
```

### 3. Missing Environment Variables
**Required variables:**
```bash
APP_KEY=base64:...
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.railway.app
DB_CONNECTION=pgsql
```

### 4. Build Failures
**Symptom:** Build logs show errors  
**Check:**
- npm dependencies install correctly
- Vite build completes
- Composer dependencies resolve

### 5. Port Binding Issues
**Symptom:** Server starts but Railway can't connect  
**Solution:** Ensure binding to `0.0.0.0:$PORT` (already fixed in railway-start.sh)

## 🛠️ Debugging Steps

### Step 1: Check Railway Build Logs
1. Go to Railway Dashboard
2. Click on your service
3. Go to "Deployments"
4. Click on failed deployment
5. Check "Build Logs" tab

Look for:
- ❌ npm/composer install errors
- ❌ "Class not found" errors
- ❌ Build command failures

### Step 2: Check Railway Deploy Logs
After build, check "Deploy Logs":

Look for:
- ❌ "RuntimeException: No application encryption key has been specified"
- ❌ Database connection errors
- ❌ "SQLSTATE" errors
- ✅ "Starting web server on port..." (should see this)

### Step 3: Verify Environment Variables
In Railway Dashboard → Variables, ensure you have:

**Required:**
- ✅ APP_KEY (starts with `base64:`)
- ✅ APP_ENV=production
- ✅ APP_DEBUG=false
- ✅ APP_URL (your Railway URL)
- ✅ DB_CONNECTION=pgsql

**Database (Railway auto-provides these):**
- ✅ DATABASE_URL
- ✅ DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD

### Step 4: Test Health Endpoint Locally
```bash
# Start local server
php artisan serve

# Test health endpoint (should return 200 OK)
curl http://localhost:8000/up
```

### Step 5: Check Database Service
In Railway Dashboard:
- ✅ PostgreSQL/MySQL service is running (green status)
- ✅ Service is in the same project
- ✅ Variables are linked

## 🔧 Quick Fixes

### Fix 1: Regenerate APP_KEY
```bash
# Locally
php artisan key:generate --show

# Copy output to Railway Variables
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

### Fix 2: Simplify Database for Testing
Temporarily use SQLite to test if database is the issue:

```bash
# In Railway Variables, temporarily set:
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
```

Then check if healthcheck passes. If yes, issue is with PostgreSQL connection.

### Fix 3: Disable Health Check Temporarily
In `railway.json`:
```json
{
  "deploy": {
    "healthcheckPath": "",
    "healthcheckTimeout": 0
  }
}
```

This helps identify if app starts but health endpoint has issues.

### Fix 4: Check Routes
```bash
# Locally, verify /up route exists
php artisan route:list | grep "/up"

# Should show:
# GET  /up  ......  Illuminate\Foundation\Http\Middleware\CheckForMaintenanceMode
```

## 📊 What the Startup Script Does

The new `railway-start.sh`:

1. ✅ Checks if APP_KEY is set, generates if missing
2. ✅ Runs database migrations
3. ✅ Creates storage symlink
4. ✅ Clears stale cache
5. ✅ Caches config/routes/views (if no errors)
6. ✅ Starts Laravel server on correct port

## 🚀 Redeploy Steps

```bash
# 1. Commit the fixes
git add .
git commit -m "Fix Railway healthcheck issues"
git push origin main

# 2. Verify environment variables in Railway Dashboard

# 3. Check build and deploy logs

# 4. If still failing, check specific error in logs
```

## 💡 Pro Tips

### Enable Better Logging
Add to Railway Variables:
```bash
LOG_LEVEL=debug
LOG_CHANNEL=stack
```

### Test Database Connection
Add this temporary route to test DB:
```php
// routes/web.php
Route::get('/test-db', function () {
    try {
        DB::connection()->getPdo();
        return 'Database connected!';
    } catch (\Exception $e) {
        return 'Database error: ' . $e->getMessage();
    }
});
```

### Check PHP Version
Ensure Railway is using PHP 8.2:
```toml
# nixpacks.toml already specifies this
nixPkgs = ['...', 'php82', 'php82Packages.composer']
```

## ⚠️ Common Mistakes

1. ❌ Not setting APP_KEY
2. ❌ Using wrong DB_CONNECTION (mysql vs pgsql)
3. ❌ Forgetting to add database service
4. ❌ Overriding DATABASE_URL incorrectly
5. ❌ Setting APP_DEBUG=true in production
6. ❌ Wrong healthcheck path

## 📞 Still Not Working?

### Check Specific Errors:

**Error: "No application encryption key"**
→ Set APP_KEY in Railway Variables

**Error: "SQLSTATE[HY000] [2002]"**
→ Database connection issue, check DB_CONNECTION and database service

**Error: "Class not found"**
→ Run `composer dump-autoload` and redeploy

**Error: "npm run build failed"**
→ Check Vite config and ensure all dependencies in package.json

**Error: "Storage directory not writable"**
→ Railway handles this automatically, shouldn't occur

### Get Detailed Logs:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# View live logs
railway logs

# Run commands in Railway environment
railway run php artisan --version
railway run php artisan route:list
```

## ✅ Success Indicators

When deployment is successful, you should see:

**In Deploy Logs:**
```
🚀 Starting Railway deployment...
📊 Running database migrations...
🔗 Creating storage symlink...
🧹 Clearing cache...
⚡ Caching configuration...
✅ Deployment preparation complete!
🌐 Starting web server on port 3000...
Laravel development server started: http://0.0.0.0:3000
```

**In Railway Dashboard:**
- ✅ Status shows "Active" (green)
- ✅ Healthcheck shows "Healthy"
- ✅ Can visit your app URL
- ✅ No errors in logs

---

## 🎯 Next Steps After Fix

1. Test your app URL
2. Verify Shopify OAuth works
3. Test webhook endpoints
4. Monitor logs for any errors
5. Set up proper monitoring/alerts

**Your deployment should now be successful! 🎉**
