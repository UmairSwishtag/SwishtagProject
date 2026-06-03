<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Osiset\ShopifyApp\Util;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Webhook\ProductWebhookController;
use App\Http\Controllers\Shopify\ProductSyncController;

/*
|--------------------------------------------------------------------------
| Health Check (unauthenticated)
|--------------------------------------------------------------------------
*/
Route::get('/health', function () {
    return response('OK', 200);
});

/*
|--------------------------------------------------------------------------
| Shopify Embedded Protected Routes
|--------------------------------------------------------------------------
*/
Route::group(['middleware' => ['verify.shopify']], function () {

    Route::get('/', function () {
        return redirect()->route('dashboard', request()->query());
    })->name(config('shopify-app.route_names.home', 'home'));

    Route::get('/sync-products', [ProductSyncController::class, 'sync']);

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/products', function () {
        return Inertia::render('SettingsPage');
    })->name('products');

    Route::get('/search', [DashboardController::class, 'orderSeacrhfilter'])->name('search');
});

// Webhook ingress must not use verify.shopify because Shopify sends signed webhook requests
Route::post('/webhook/products/{action}', [ProductWebhookController::class, 'handle'])
    ->middleware('auth.webhook')
    ->whereIn('action', ['create', 'update', 'delete']);

Route::match(['GET', 'POST'], '/authenticate', [AuthenticatedSessionController::class, 'authenticate'])
    ->name('authenticate');

Route::get('/authenticate/token', [AuthenticatedSessionController::class, 'token'])
    ->middleware(['verify.shopify'])
    ->name(Util::getShopifyConfig('route_names.authenticate.token'));


/*
|--------------------------------------------------------------------------
| Manual sync (admin trigger)
|--------------------------------------------------------------------------
| IMPORTANT: this should NOT be inside Shopify middleware
| because shop is already authenticated via package session
*/




/*
|--------------------------------------------------------------------------
| App Proxy — called by Shopify on behalf of the storefront visitor
| URL: https://{shop}/apps/tracker/price-change?product_id=...
| Shopify forwards to: APP_URL/proxy/price-change?shop=...&product_id=...
| No CORS issues, no block setting needed, works in production.
|--------------------------------------------------------------------------
*/
Route::get('/proxy/price-change', function (\Illuminate\Http\Request $request) {
    $shopDomain = strtolower(trim((string) $request->query('shop', '')));
    if ($shopDomain === '') {
        $shopDomain = strtolower(trim((string) $request->header('x-shopify-shop-domain', '')));
    }
    $productId     = (string) $request->query('product_id', '');
    $productHandle = trim((string) $request->query('handle', ''));
    $variantIdRaw  = (string) $request->query('variant_id', '');
    $variantId     = preg_match('/(\d+)/', $variantIdRaw, $match) ? $match[1] : '';

    if ($shopDomain === '' || ($productId === '' && $productHandle === '')) {
        return response()->json(['hasChange' => false]);
    }

    $base = \App\Models\Products\Product::query()
        ->whereHas('user', fn ($q) => $q->whereRaw('LOWER(name) = ?', [$shopDomain]));

    $product = $productId !== ''
        ? (clone $base)->where('shopify_product_id', $productId)->first()
        : null;

    if (!$product && $productHandle !== '') {
        $product = (clone $base)->where('handle', $productHandle)->first();
    }

    if (!$product) {
        return response()->json(['hasChange' => false]);
    }

    $changeQuery = \App\Models\ProductVersion::where('product_id', $product->id)
        ->where('changed_field', 'price')
        ->whereNotNull('old_value')
        ->whereNotNull('new_value');

    if ($variantId !== '') {
        $variant = \App\Models\Products\ProductVarient::query()
            ->where('product_id', $product->id)
            ->where('shopify_product_varient_id', $variantId)
            ->first();

        if ($variant) {
            $changeQuery->where('variant_id', $variant->id);
        }
    }

    $change = $changeQuery
        ->orderByDesc('changed_at')
        ->first();

    if (!$change && $variantId !== '') {
        $change = \App\Models\ProductVersion::query()
            ->where('product_id', $product->id)
            ->where('changed_field', 'price')
            ->whereNotNull('old_value')
            ->whereNotNull('new_value')
            ->orderByDesc('changed_at')
            ->first();
    }

    if (!$change) {
        $variantFallbackQuery = \App\Models\Products\ProductVarient::query()
            ->where('product_id', $product->id);

        if ($variantId !== '') {
            $variantFallbackQuery->where('shopify_product_varient_id', $variantId);
        }

        $variantFallback = $variantFallbackQuery->first();

        if (!$variantFallback && $variantId !== '') {
            $variantFallback = \App\Models\Products\ProductVarient::query()
                ->where('product_id', $product->id)
                ->whereNotNull('compare_at_price')
                ->whereNotNull('price')
                ->first();
        }

        $oldFromCompare = is_numeric($variantFallback?->compare_at_price)
            ? (float) $variantFallback->compare_at_price
            : null;
        $newFromPrice = is_numeric($variantFallback?->price)
            ? (float) $variantFallback->price
            : null;

        if ($oldFromCompare !== null && $newFromPrice !== null && $oldFromCompare > $newFromPrice) {
            return response()->json([
                'hasChange' => true,
                'oldPrice'  => $oldFromCompare,
                'newPrice'  => $newFromPrice,
            ]);
        }
    }

    if (!$change || (string) $change->old_value === (string) $change->new_value) {
        return response()->json(['hasChange' => false]);
    }

    return response()->json([
        'hasChange' => true,
        'oldPrice'  => (float) $change->old_value,
        'newPrice'  => (float) $change->new_value,
    ]);
});

/*
|--------------------------------------------------------------------------
| Auth routes
|--------------------------------------------------------------------------
*/
require __DIR__ . '/auth.php';