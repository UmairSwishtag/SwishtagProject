<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\ProductVersion; 
use App\Models\Products\Product;
use App\Http\Controllers\Webhook\ProductWebhookController;
/*
|--------------------------------------------------------------------------
| Test API
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Product Changes API
|--------------------------------------------------------------------------
*/

// Maps raw changed_field values to the 3 frontend change types
if (!function_exists('resolveChangeType')) {
    function resolveChangeType(string $field): string
    {
        if ($field === 'price') {
            return 'price';
        }
        if ($field === 'inventory') {
            return 'inventory';
        }
        // title, body_html, tags, vendor, product_type, images, created, deleted → content
        return 'content';
    }
}
Route::post('/webhooks/products/{action}', [ProductWebhookController::class, 'handle'])
    ->middleware('auth.webhook')
    ->whereIn('action', ['create', 'update', 'delete'])
    ->name('webhooks.products.handle');
Route::middleware(['verify.shopify'])->get('/product-changes', function () {
    $shop = request()->user();

    $versions = ProductVersion::with([
            'product.productMedias',
            'product.productVarients',
            'variant',
        ])
        ->whereHas('product', function ($query) use ($shop) {
            $query->where('user_id', $shop->id);
        })
        ->whereNotNull('changed_field')
        ->orderByDesc('changed_at')
        ->take(200)
        ->get();

    return $versions->map(function ($version) use ($shop) {
        $product = $version->product;

        // Prefer the specific variant's SKU, fall back to the product's first variant
        $sku = $version->variant?->sku
            ?? $product?->productVarients->first()?->sku;

        // Format price values with currency symbol when change type is price
        $changeType = resolveChangeType($version->changed_field ?? '');
        $oldValue = $version->old_value;
        $newValue = $version->new_value;

        // For 'created' events, format a user-friendly label
        if ($version->changed_field === 'created') {
            $oldValue = null;
            $newValue = 'Product added to catalog';
        } elseif ($changeType === 'price') {
            $oldValue = $oldValue !== null ? '$' . number_format((float) $oldValue, 2) : null;
            $newValue = $newValue !== null ? '$' . number_format((float) $newValue, 2) : null;
        } elseif ($changeType === 'inventory') {
            $oldValue = $oldValue !== null ? $oldValue . ' units' : null;
            $newValue = $newValue !== null ? $newValue . ' units' : null;
        }

        $shopDomain = strtolower(trim((string) ($shop?->name ?? '')));
        $shopifyProductId = $product?->shopify_product_id ? (string) $product->shopify_product_id : null;
        $adminProductUrl = ($shopDomain !== '' && $shopifyProductId)
            ? sprintf('https://%s/admin/products/%s', $shopDomain, $shopifyProductId)
            : null;
        $storefrontProductUrl = ($shopDomain !== '' && !empty($product?->handle))
            ? sprintf('https://%s/products/%s', $shopDomain, ltrim((string) $product->handle, '/'))
            : null;

        return [
            'id'          => $version->id,
            'productName' => $product?->title,
            'productImage'=> $product?->productMedias->first()?->src,
            'shopifyProductId' => $shopifyProductId,
            'productHandle' => $product?->handle,
            'adminProductUrl' => $adminProductUrl,
            'storefrontProductUrl' => $storefrontProductUrl,
            'changeType'  => $changeType,
            'changedField'=> $version->changed_field,
            'oldValue'    => $oldValue,
            'newValue'    => $newValue,
            'createdAt'   => $version->changed_at?->toIso8601String(),
            'source'      => $version->source ?? 'webhook',
            'sku'         => $sku,
        ];
    });
});

// Public endpoint for storefront app blocks (no Shopify admin session available there)
Route::get('/storefront/product-price-change', function (Request $request) {
    $shopDomain = strtolower(trim((string) $request->query('shop', '')));
    $shopifyProductId = (string) $request->query('product_id', '');
    $productHandle = trim((string) $request->query('handle', ''));

    if ($shopDomain === '' || ($shopifyProductId === '' && $productHandle === '')) {
        return response()->json(['hasChange' => false]);
    }

    $productQuery = Product::query()
        ->whereHas('user', function ($query) use ($shopDomain) {
            $query->whereRaw('LOWER(name) = ?', [$shopDomain]);
        });

    $product = null;

    if ($shopifyProductId !== '') {
        $product = (clone $productQuery)
            ->where('shopify_product_id', $shopifyProductId)
            ->first();
    }

    if (!$product && $productHandle !== '') {
        $product = (clone $productQuery)
            ->where('handle', $productHandle)
            ->first();
    }

    if (!$product) {
        return response()->json(['hasChange' => false]);
    }

    $latestPriceChange = ProductVersion::query()
    ->where('product_id', $product->id)
    ->where('changed_field', 'price')
    ->whereNotNull('old_value')
    ->whereNotNull('new_value')
    ->orderByDesc('changed_at')
    ->first();

    
   $latestPriceChange = ProductVersion::query()
    ->where('product_id', $product->id)
    ->where('changed_field', 'price')
    ->whereNotNull('old_value')
    ->whereNotNull('new_value')
    ->orderByDesc('changed_at')
    ->first();

if (!$latestPriceChange) {
    $variantFallback = \App\Models\Products\ProductVarient::query()
        ->where('product_id', $product->id)
        ->whereNotNull('compare_at_price')
        ->whereNotNull('price')
        ->first();

    $oldFromCompare = is_numeric($variantFallback?->compare_at_price)
        ? (float) $variantFallback->compare_at_price
        : null;
    $newFromPrice = is_numeric($variantFallback?->price)
        ? (float) $variantFallback->price
        : null;

    if ($oldFromCompare === null || $newFromPrice === null || $oldFromCompare <= $newFromPrice) {
        return response()->json(['hasChange' => false]);
    }

    $origin = request()->header('Origin', '');
    $allowOrigin = preg_match('/^https:\/\/[a-z0-9\-]+\.myshopify\.com$/', $origin) ? $origin : '*';

    return response()->json([
        'hasChange' => true,
        'oldPrice' => $oldFromCompare,
        'newPrice' => $newFromPrice,
    ])->header('Access-Control-Allow-Origin', $allowOrigin)
      ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      ->header('Access-Control-Allow-Headers', 'Content-Type');
}

$origin = request()->header('Origin', '');
    $allowOrigin = preg_match('/^https:\/\/[a-z0-9\-]+\.myshopify\.com$/', $origin) ? $origin : '*';

    return response()->json([
        'hasChange' => true,
        'oldPrice' => (float) $latestPriceChange->old_value,
        'newPrice' => (float) $latestPriceChange->new_value,
    ])->header('Access-Control-Allow-Origin', $allowOrigin)
      ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      ->header('Access-Control-Allow-Headers', 'Content-Type');
});

// Handle OPTIONS preflight for the storefront endpoint
Route::options('/storefront/product-price-change', function (Request $request) {
    $origin = $request->header('Origin', '');
    $allowOrigin = preg_match('/^https:\/\/[a-z0-9\-]+\.myshopify\.com$/', $origin) ? $origin : '*';
    return response('', 204)
        ->header('Access-Control-Allow-Origin', $allowOrigin)
        ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type')
        ->header('Access-Control-Max-Age', '86400');
});