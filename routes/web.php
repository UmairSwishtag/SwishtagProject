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
| Shopify Embedded Protected Routes
|--------------------------------------------------------------------------
*/
Route::group(['middleware' => ['verify.shopify']], function () {

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
| Auth routes
|--------------------------------------------------------------------------
*/
require __DIR__ . '/auth.php';