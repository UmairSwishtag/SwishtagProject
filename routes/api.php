<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\ProductVersion;

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

    return $versions->map(function ($version) {
        $product = $version->product;

        // Prefer the specific variant's SKU, fall back to the product's first variant
        $sku = $version->variant?->sku
            ?? $product?->productVarients->first()?->sku;

        // Format price values with currency symbol when change type is price
        $changeType = resolveChangeType($version->changed_field ?? '');
        $oldValue = $version->old_value;
        $newValue = $version->new_value;

        if ($changeType === 'price') {
            $oldValue = $oldValue !== null ? '$' . number_format((float) $oldValue, 2) : null;
            $newValue = $newValue !== null ? '$' . number_format((float) $newValue, 2) : null;
        } elseif ($changeType === 'inventory') {
            $oldValue = $oldValue !== null ? $oldValue . ' units' : null;
            $newValue = $newValue !== null ? $newValue . ' units' : null;
        }

        return [
            'id'          => $version->id,
            'productName' => $product?->title,
            'productImage'=> $product?->productMedias->first()?->src,
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