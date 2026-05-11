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

        if (!$shop) return;

        $webhooks = [
            [
                'topic' => 'products/update',
                'address' => config('app.url') . '/webhook/products/update',
            ],
            [
                'topic' => 'products/create',
                'address' => config('app.url') . '/webhook/products/create',
            ],
            [
                'topic' => 'products/delete',
                'address' => config('app.url') . '/webhook/products/delete',
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