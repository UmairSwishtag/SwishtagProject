<?php

namespace App\Http\Traits;

use Osiset\ShopifyApp\Util;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Redirect;
use Osiset\ShopifyApp\Actions\AuthenticateShop;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use Osiset\ShopifyApp\Exceptions\MissingAuthUrlException;
use Osiset\ShopifyApp\Exceptions\SignatureVerificationException;

/**
 * Responsible for authenticating the shop.
 */
trait ShopifyAuthTrait
{
    /**
     * Installing/authenticating a shop.
     *
     * @return mixed
     */
    public function authenticate(Request $request, AuthenticateShop $authShop)
    {
        if ($request->missing('shop') && !$request->user()) {
            return redirect('/')->with('error', 'Missing shop domain. Please open the app from Shopify admin.');
        }

        // Get the shop domain
        $shopDomain = $request->has('shop')
        ? ShopDomain::fromNative($request->get('shop'))
        : $request->user()->getDomain();

        // If the domain is obtained from $request->user()
        if ($request->missing('shop')) {
            $request['shop'] = $shopDomain->toNative();
        }
        // Run the action
        [$result, $status] = $authShop($request);

        if ($status === null) {
            // Show exception, something is wrong
            throw new SignatureVerificationException('Invalid HMAC verification');
        } elseif ($status === false) {
            if (!$result['url']) {
                throw new MissingAuthUrlException('Missing auth url');
            }

            $shopDomain = $shopDomain->toNative();
            $shopOrigin = $shopDomain ?? $request->user()->name;

            return View::make(
                'shopify-app::auth.fullpage_redirect',
                [
                    'apiKey' => Util::getShopifyConfig('api_key', $shopOrigin),
                    'url' => $result['url'],
                    'host' => $request->get('host'),
                    'shopDomain' => $shopDomain,
                ]
            );
        } else {
            // Embedded flow requires shop + host to continue App Bridge token handshake.
            return Redirect::route(
                Util::getShopifyConfig('route_names.home'),
                [
                    'shop' => $shopDomain->toNative(),
                    'host' => $request->get('host'),
                    'locale' => $request->get('locale'),
                ]
            );

        }
    }

    /**
     * Get session token for a shop.
     *
     * @return mixed
     */
    public function token(Request $request)
    {
        $shopDomain = ShopDomain::fromRequest($request);
        if (!$shopDomain) {
            return redirect('/')->with('error', 'Missing shop domain. Please open the app from Shopify admin.');
        }

        $target = $request->query('target');
        $query = parse_url($target, PHP_URL_QUERY);

        $cleanTarget = $target;
        if ($query) {
            // remove "token" from the target's query string
            $params = Util::parseQueryString($query);
            $params['shop'] = $params['shop'] ?? $shopDomain->toNative() ?? '';
            $params['host'] = $request->get('host');
            $params['locale'] = $request->get('locale');
            unset($params['token']);

            $cleanTarget = trim(explode('?', $target)[0] . '?' . http_build_query($params), '?');
        } else {
            $params = [
                'shop' => $shopDomain->toNative() ?? '',
                'host' => $request->get('host'),
                'locale' => $request->get('locale'),
            ];
            $cleanTarget = trim(explode('?', $target)[0] . '?' . http_build_query($params), '?');
        }

        return View::make(
            'shopify-app::auth.token',
            [
                'shopDomain' => $shopDomain->toNative(),
                'target' => $cleanTarget,
            ]
        );
    }
}
