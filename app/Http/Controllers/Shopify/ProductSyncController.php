<?php

namespace App\Http\Controllers\Shopify;

use App\Http\Controllers\Controller;
use App\Models\Products\Collection;
use App\Models\Products\Product;
use App\Models\Products\ProductVarient;
use App\Models\Products\ProductMedia;
use App\Models\User;
use App\Models\ProductVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductSyncController extends Controller
{
    private string $apiVersion = '2025-04';

    public function sync(Request $request)
    {
        $shop = $request->user();

        // Fallback for embedded requests where session auth is present but shop context is missing.
        $shopDomain = (string) $request->query('shop', '');
        if ((!$shop || empty($shop->name) || !str_contains((string) $shop->name, 'myshopify.com')) && $shopDomain !== '') {
            $shop = User::where('name', $shopDomain)->first();
            if ($shop) {
                Auth::login($shop);
            }
        }

        if (!$shop) {
            return response()->json(['error' => 'Shopify session not found'], 403);
        }

        $synced = 0;
        $cursor = null;
        $hasNextPage = true;

        while ($hasNextPage) {
            $afterClause = $cursor ? ', after: "' . $cursor . '"' : '';

            $query = <<<GQL
            {
              products(first: 250{$afterClause}) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                edges {
                  node {
                    id
                    title
                    handle
                    descriptionHtml
                    tags
                    vendor
                    productType
                    status
                    variants(first: 100) {
                      edges {
                        node {
                          id
                          title
                          sku
                          price
                          compareAtPrice
                          inventoryQuantity
                          inventoryItem {
                            id
                          }
                        }
                      }
                    }
                    images(first: 20) {
                      edges {
                        node {
                          id
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
            GQL;

            $response = $shop->api()->graph($query);

            if (!empty($response['errors'])) {
                // errors === true means Guzzle threw a ClientException (4xx/5xx HTTP error).
                // The actual Shopify error message is in $response['body'] in that case.
                if ($response['errors'] === true) {
                    $raw = $response['body'];
                    $errorMsg = is_string($raw) ? $raw : json_encode($raw);
                } else {
                    $raw = $response['errors'];
                    $errorMsg = is_string($raw) ? $raw : json_encode($raw);
                }

                $status = $response['status'] ?? 200;

                if ($status === 401 || str_contains($errorMsg, 'Invalid API key') || str_contains($errorMsg, 'access token')) {
                    $reauthUrl = route('authenticate', ['shop' => $shop->name]);
                    return response()->json([
                        'error' => 'Shopify API: Invalid or expired access token. Please reinstall the app to re-authorize.',
                        'reauth_url' => $reauthUrl,
                        'shop' => $shop->name,
                        'details' => $errorMsg,
                    ], 401);
                }

                if ($status === 403 || str_contains($errorMsg, 'ACCESS_DENIED') || str_contains($errorMsg, 'Access denied')) {
                    return response()->json([
                        'error' => 'Shopify API: Access denied — the app is missing the read_products scope. Please reinstall the app from your Shopify admin to grant the required permissions.',
                        'details' => $errorMsg,
                    ], 403);
                }

                return response()->json([
                    'error' => 'Shopify API error: ' . $errorMsg,
                    'details' => $errorMsg,
                ], 500);
            }

            $productsData = $response['body']['data']['products'] ?? null;
            if (!$productsData) {
                break;
            }

            $hasNextPage = $productsData['pageInfo']['hasNextPage'] ?? false;
            $cursor = $productsData['pageInfo']['endCursor'] ?? null;
            $edges = $productsData['edges'] ?? [];

            foreach ($edges as $edge) {
                $this->syncProduct($edge['node'], $shop->id);
            }

            $synced += count($edges);
        }

        // Sync collections via GraphQL
        $this->syncCollections($shop);

        return response()->json([
            'success' => true,
            'products_synced' => $synced,
        ]);
    }

    protected function syncProduct(array $node, int $shopId): Product
    {
        return DB::transaction(function () use ($node, $shopId) {
            // Convert GraphQL global ID to numeric Shopify ID
            // e.g. "gid://shopify/Product/123456" → 123456
            $shopifyProductId = $this->extractNumericId($node['id']);

            $existing = Product::where('shopify_product_id', $shopifyProductId)->first();

            $tags = is_array($node['tags']) ? implode(',', $node['tags']) : ($node['tags'] ?? '');

            $product = Product::updateOrCreate(
                ['shopify_product_id' => $shopifyProductId],
                [
                    'user_id' => $shopId,
                    'title' => $node['title'] ?? null,
                    'handle' => $node['handle'] ?? null,
                    'body_html' => $node['descriptionHtml'] ?? null,
                    'tags' => $tags,
                    'vendor' => $node['vendor'] ?? null,
                    'product_type' => $node['productType'] ?? null,
                    'status' => strtolower($node['status'] ?? 'active'),
                ]
            );

            if ($existing) {
                $this->recordContentChanges($product, $existing, [
                    'title' => $node['title'] ?? null,
                    'body_html' => $node['descriptionHtml'] ?? null,
                    'tags' => $tags,
                    'vendor' => $node['vendor'] ?? null,
                    'product_type' => $node['productType'] ?? null,
                ]);
            }

            $variantIds = [];
            foreach ($node['variants']['edges'] ?? [] as $variantEdge) {
                $variant = $variantEdge['node'];
                $shopifyVariantId = $this->extractNumericId($variant['id']);
                $shopifyInventoryItemId = isset($variant['inventoryItem']['id'])
                    ? $this->extractNumericId($variant['inventoryItem']['id'])
                    : null;

                $existingVariant = ProductVarient::where('shopify_product_varient_id', $shopifyVariantId)
                    ->where('product_id', $product->id)
                    ->first();

                $price = $variant['price'] ?? null;
                $inventory = isset($variant['inventoryQuantity']) ? (int) $variant['inventoryQuantity'] : 0;

                $variantRecord = ProductVarient::updateOrCreate(
                    ['shopify_product_varient_id' => $shopifyVariantId],
                    [
                        'product_id' => $product->id,
                        'sku' => $variant['sku'] ?? null,
                        'price' => $price,
                        'title' => $variant['title'] ?? null,
                        'shopify_inventory_item_id' => $shopifyInventoryItemId,
                        'compare_at_price' => $variant['compareAtPrice'] ?? null,
                        'inventory_quantity' => $inventory,
                    ]
                );

                if ($existingVariant) {
                    if ($price !== null && (string) $existingVariant->price !== (string) $price) {
                        ProductVersion::create([
                            'product_id' => $product->id,
                            'variant_id' => $variantRecord->id,
                            'changed_field' => 'price',
                            'old_value' => (string) $existingVariant->price,
                            'new_value' => (string) $price,
                            'source' => 'sync',
                            'changed_at' => now(),
                        ]);
                    }

                    if ((int) $existingVariant->inventory_quantity !== $inventory) {
                        ProductVersion::create([
                            'product_id' => $product->id,
                            'variant_id' => $variantRecord->id,
                            'changed_field' => 'inventory',
                            'old_value' => (string) $existingVariant->inventory_quantity,
                            'new_value' => (string) $inventory,
                            'source' => 'sync',
                            'changed_at' => now(),
                        ]);
                    }
                }

                $variantIds[] = $shopifyVariantId;
            }

            ProductVarient::where('product_id', $product->id)
                ->whereNotIn('shopify_product_varient_id', $variantIds)
                ->delete();

            $mediaIds = [];
            foreach ($node['images']['edges'] ?? [] as $imageEdge) {
                $image = $imageEdge['node'];
                $shopifyImageId = $this->extractNumericId($image['id']);

                $imageRecord = ProductMedia::updateOrCreate(
                    ['shopify_product_media_id' => $shopifyImageId],
                    [
                        'product_id' => $product->id,
                        'position' => null,
                        'src' => $image['url'] ?? null,
                    ]
                );

                $mediaIds[] = $shopifyImageId;
            }

            ProductMedia::where('product_id', $product->id)
                ->whereNotIn('shopify_product_media_id', $mediaIds)
                ->delete();

            return $product;
        });
    }

    protected function recordContentChanges(Product $product, Product $existing, array $payload): void
    {
        $contentFields = ['title', 'body_html', 'tags', 'vendor', 'product_type'];

        foreach ($contentFields as $field) {
            $newVal = $payload[$field] ?? null;
            $oldVal = $existing->{$field};

            if ($newVal !== null && (string) $oldVal !== (string) $newVal) {
                ProductVersion::create([
                    'product_id' => $product->id,
                    'changed_field' => $field,
                    'old_value' => (string) $oldVal,
                    'new_value' => (string) $newVal,
                    'source' => 'sync',
                    'changed_at' => now(),
                ]);
            }
        }
    }

    protected function syncCollections($shop): void
    {
        $cursor = null;
        $hasNextPage = true;

        while ($hasNextPage) {
            $afterClause = $cursor ? ', after: "' . $cursor . '"' : '';

            $query = <<<GQL
            {
              collections(first: 250{$afterClause}) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                edges {
                  node {
                    id
                    title
                    handle
                    sortOrder
                    products(first: 250) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
            GQL;

            $response = $shop->api()->graph($query);

            if (!empty($response['errors'])) {
                // Log but continue — don't fail the whole sync if collections are inaccessible
                \Illuminate\Support\Facades\Log::warning('Shopify collections sync error', [
                    'errors' => $response['errors'] === true ? $response['body'] : $response['errors'],
                    'status' => $response['status'] ?? null,
                ]);
                break;
            }

            $collectionsData = $response['body']['data']['collections'] ?? null;
            if (!$collectionsData) {
                break;
            }

            $hasNextPage = $collectionsData['pageInfo']['hasNextPage'] ?? false;
            $cursor = $collectionsData['pageInfo']['endCursor'] ?? null;

            foreach ($collectionsData['edges'] ?? [] as $edge) {
                $col = $edge['node'];
                $shopifyCollectionId = $this->extractNumericId($col['id']);

                // Determine collection type: if sortOrder is "MANUAL" it's custom, otherwise smart
                $sortOrder = $col['sortOrder'] ?? '';
                $collectionType = $sortOrder === 'MANUAL' ? 'custom' : 'smart';

                $collection = Collection::updateOrCreate(
                    ['shopify_collection_id' => $shopifyCollectionId],
                    [
                        'user_id' => $shop->id,
                        'title' => $col['title'] ?? null,
                        'handle' => $col['handle'] ?? null,
                        'collection_type' => $collectionType,
                    ]
                );

                // Sync product associations
                $productIds = [];
                foreach ($col['products']['edges'] ?? [] as $productEdge) {
                    $shopifyProductId = $this->extractNumericId($productEdge['node']['id']);
                    $product = Product::where('shopify_product_id', $shopifyProductId)
                        ->where('user_id', $shop->id)
                        ->first();
                    if ($product) {
                        $productIds[] = $product->id;
                    }
                }

                $collection->products()->sync($productIds);
            }
        }
    }

    /**
     * Extract numeric Shopify ID from a GraphQL global ID.
     * "gid://shopify/Product/123456789" → 123456789
     */
    protected function extractNumericId(string $gid): int
    {
        return (int) substr($gid, strrpos($gid, '/') + 1);
    }
}
