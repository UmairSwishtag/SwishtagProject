<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ShopifyService
{
    protected $shop;
    protected $accessToken;
    protected $apiVersion = '2024-01';

    public function __construct($shop, $accessToken)
    {
        $this->shop = $shop;
        $this->accessToken = $accessToken;
    }

    /**
     * Make GraphQL Request
     */
    public function graphql($query, $variables = [])
    {
        $url = "https://{$this->shop}/admin/api/{$this->apiVersion}/graphql.json";

        $response = Http::withHeaders([
            'X-Shopify-Access-Token' => $this->accessToken,
            'Content-Type' => 'application/json',
        ])->post($url, [
            'query' => $query,
            'variables' => $variables,
        ]);

        if ($response->failed()) {
            throw new \Exception('Shopify API Error: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Get Products (Initial Sync)
     */
    public function getProducts($first = 50)
    {
        $query = <<<GRAPHQL
        {
          products(first: $first) {
            edges {
              node {
                id
                title
                handle
                variants(first: 5) {
                  edges {
                    node {
                      id
                      price
                      inventoryQuantity
                    }
                  }
                }
              }
            }
          }
        }
        GRAPHQL;

        return $this->graphql($query);
    }
}