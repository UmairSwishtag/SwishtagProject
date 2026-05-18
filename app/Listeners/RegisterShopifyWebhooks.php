<?php

namespace App\Listeners;

use App\Models\User;
use Osiset\ShopifyApp\Messaging\Events\ShopAuthenticatedEvent;

class RegisterShopifyWebhooks
{
    public function handle(ShopAuthenticatedEvent $event)
    {
        $shopId = $event->shopId->toNative();
        $shop = User::find($shopId);
        $baseUrl = rtrim((string) config('app.url'), '/');

        if (!$shop) return;

        $webhooks = [
            [
                'topic' => 'products/update',
                'address' => $baseUrl . '/api/webhooks/products/update',
            ],
            [
                'topic' => 'products/create',
                'address' => $baseUrl . '/api/webhooks/products/create',
            ],
            [
                'topic' => 'products/delete',
                'address' => $baseUrl . '/api/webhooks/products/delete',
            ],
        ];

        foreach ($webhooks as $webhook) {
            try {
                $shop->api()->rest('POST', '/admin/api/2025-04/webhooks.json', [
                    'webhook' => $webhook
                ]);
            } catch (\Exception $e) {
                logger()->error('Webhook registration failed: ' . $e->getMessage());
            }
        }
    }
}