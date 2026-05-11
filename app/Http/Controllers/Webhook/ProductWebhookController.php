<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Products\Product;
use App\Models\Products\ProductVarient;
use App\Models\Products\ProductMedia;
use App\Models\ProductVersion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductWebhookController extends Controller
{
    public function handle(Request $request, string $action)
    {
        $payload = $request->json()->all();
        $shopDomain = $request->header('x-shopify-shop-domain');
        $shop = User::where('name', $shopDomain)->first();

        if (!$shop) {
            return response()->json(['message' => 'Shop not found'], 404);
        }

        switch ($action) {
            case 'create':
                return $this->handleCreate($payload, $shop);
            case 'update':
                return $this->handleUpdate($payload, $shop);
            case 'delete':
                return $this->handleDelete($payload, $shop);
            default:
                return response()->json(['message' => 'Webhook action not supported'], 400);
        }
    }

    protected function handleCreate(array $payload, User $shop)
    {
        $product = $this->syncProductPayload($payload, $shop);

        if ($product) {
            ProductVersion::create([
                'product_id' => $product->id,
                'changed_field' => 'created',
                'old_value' => null,
                'new_value' => $product->title,
                'source' => 'webhook',
                'changed_at' => now(),
            ]);

            return response()->json(['ok' => true], 201);
        }

        return response()->json(['ok' => false], 500);
    }

    protected function handleUpdate(array $payload, User $shop)
    {
        $product = Product::where('shopify_product_id', $payload['id'] ?? null)
            ->where('user_id', $shop->id)
            ->first();

        if (!$product) {
            $product = $this->syncProductPayload($payload, $shop);
            if ($product) {
                return response()->json(['ok' => true], 200);
            }
            return response()->json(['ok' => false], 500);
        }

        DB::transaction(function () use ($product, $payload) {
            $this->recordProductChanges($product, $payload);
            $this->syncVariants($product, $payload['variants'] ?? []);
            $this->syncImages($product, $payload['images'] ?? []);
            $product->update([
                'title' => $payload['title'] ?? $product->title,
                'handle' => $payload['handle'] ?? $product->handle,
                'body_html' => $payload['body_html'] ?? $product->body_html,
                'tags' => is_array($payload['tags']) ? implode(',', $payload['tags']) : ($payload['tags'] ?? $product->tags),
                'vendor' => $payload['vendor'] ?? $product->vendor,
                'product_type' => $payload['product_type'] ?? $product->product_type,
                'status' => $payload['status'] ?? $product->status,
            ]);
        });

        return response()->json(['ok' => true]);
    }

    protected function handleDelete(array $payload, User $shop)
    {
        $product = Product::where('shopify_product_id', $payload['id'] ?? null)
            ->where('user_id', $shop->id)
            ->first();

        if (!$product) {
            return response()->json(['ok' => true], 200);
        }

        ProductVersion::create([
            'product_id' => $product->id,
            'changed_field' => 'deleted',
            'old_value' => $product->title,
            'new_value' => null,
            'source' => 'webhook',
            'changed_at' => now(),
        ]);

        $product->update(['status' => 'deleted']);

        return response()->json(['ok' => true]);
    }

    protected function syncProductPayload(array $payload, User $shop): ?Product
    {
        return DB::transaction(function () use ($payload, $shop) {
            $product = Product::updateOrCreate(
                ['shopify_product_id' => $payload['id']],
                [
                    'user_id' => $shop->id,
                    'title' => $payload['title'] ?? null,
                    'handle' => $payload['handle'] ?? null,
                    'body_html' => $payload['body_html'] ?? null,
                    'tags' => is_array($payload['tags']) ? implode(',', $payload['tags']) : ($payload['tags'] ?? ''),
                    'vendor' => $payload['vendor'] ?? null,
                    'product_type' => $payload['product_type'] ?? null,
                    'status' => $payload['status'] ?? null,
                ]
            );

            $this->syncVariants($product, $payload['variants'] ?? []);
            $this->syncImages($product, $payload['images'] ?? []);

            return $product;
        });
    }

    protected function recordProductChanges(Product $product, array $payload): void
    {
        // Track content-level fields
        $contentFields = ['title', 'body_html', 'vendor', 'product_type'];

        foreach ($contentFields as $field) {
            if (isset($payload[$field]) && (string) $payload[$field] !== (string) $product->{$field}) {
                ProductVersion::create([
                    'product_id' => $product->id,
                    'changed_field' => $field,
                    'old_value' => $product->{$field},
                    'new_value' => $payload[$field],
                    'source' => 'webhook',
                    'changed_at' => now(),
                ]);
            }
        }

        // Track tags (may come as string or array)
        if (isset($payload['tags'])) {
            $newTags = is_array($payload['tags']) ? implode(',', $payload['tags']) : $payload['tags'];
            if ((string) $newTags !== (string) $product->tags) {
                ProductVersion::create([
                    'product_id' => $product->id,
                    'changed_field' => 'tags',
                    'old_value' => $product->tags,
                    'new_value' => $newTags,
                    'source' => 'webhook',
                    'changed_at' => now(),
                ]);
            }
        }

        // Track image changes
        $oldImageSrcs = $product->productMedias()->pluck('src')->filter()->values()->all();
        $newImageSrcs = collect($payload['images'] ?? [])->map(fn ($image) => $image['src'] ?? null)->filter()->values()->all();
        if ($oldImageSrcs !== $newImageSrcs) {
            ProductVersion::create([
                'product_id' => $product->id,
                'changed_field' => 'images',
                'old_value' => json_encode($oldImageSrcs),
                'new_value' => json_encode($newImageSrcs),
                'source' => 'webhook',
                'changed_at' => now(),
            ]);
        }
    }

    protected function syncVariants(Product $product, array $variants): void
    {
        $incomingIds = [];

        foreach ($variants as $variant) {
            $variantId = $variant['id'] ?? null;
            if (!$variantId) {
                continue;
            }

            $incomingIds[] = $variantId;
            $existingVariant = ProductVarient::where('shopify_product_varient_id', $variantId)
                ->where('product_id', $product->id)
                ->first();

            $price = $variant['price'] ?? null;
            $inventory = isset($variant['inventory_quantity']) ? (int) $variant['inventory_quantity'] : null;

            if ($existingVariant) {
                if ($price !== null && (string) $existingVariant->price !== (string) $price) {
                    ProductVersion::create([
                        'product_id' => $product->id,
                        'variant_id' => $existingVariant->id,
                        'changed_field' => 'price',
                        'old_value' => (string) $existingVariant->price,
                        'new_value' => (string) $price,
                        'source' => 'webhook',
                        'changed_at' => now(),
                    ]);
                }

                if ($inventory !== null && (int) $existingVariant->inventory_quantity !== $inventory) {
                    ProductVersion::create([
                        'product_id' => $product->id,
                        'variant_id' => $existingVariant->id,
                        'changed_field' => 'inventory',
                        'old_value' => (string) $existingVariant->inventory_quantity,
                        'new_value' => (string) $inventory,
                        'source' => 'webhook',
                        'changed_at' => now(),
                    ]);
                }
            }

            ProductVarient::updateOrCreate(
                ['shopify_product_varient_id' => $variantId],
                [
                    'product_id' => $product->id,
                    'sku' => $variant['sku'] ?? null,
                    'price' => $price,
                    'title' => $variant['title'] ?? null,
                    'shopify_inventory_item_id' => $variant['inventory_item_id'] ?? null,
                    'compare_at_price' => $variant['compare_at_price'] ?? null,
                    'inventory_quantity' => $inventory ?? 0,
                ]
            );
        }

        ProductVarient::where('product_id', $product->id)
            ->when($incomingIds, fn ($query) => $query->whereNotIn('shopify_product_varient_id', $incomingIds))
            ->delete();
    }

    protected function syncImages(Product $product, array $images): void
    {
        $incomingIds = [];

        foreach ($images as $image) {
            $imageId = $image['id'] ?? null;
            if (!$imageId) {
                continue;
            }

            $incomingIds[] = $imageId;
            ProductMedia::updateOrCreate(
                ['shopify_product_media_id' => $imageId],
                [
                    'product_id' => $product->id,
                    'position' => $image['position'] ?? null,
                    'src' => $image['src'] ?? null,
                ]
            );
        }

        ProductMedia::where('product_id', $product->id)
            ->when($incomingIds, fn ($query) => $query->whereNotIn('shopify_product_media_id', $incomingIds))
            ->delete();
    }
}
