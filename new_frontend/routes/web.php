<?php

use App\Http\Controllers\Storefront\PageController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/'.config('storefront.default_locale')));

Route::prefix('{locale}')->where(['locale' => 'ar|en'])->group(function (): void {
    foreach ([
        '' => 'home',
        'products' => 'catalog',
        'products/{slug}' => 'product',
        'bundles' => 'bundles',
        'bundles/{slug}' => 'bundle',
        'cart' => 'cart',
        'login' => 'login',
        'register' => 'register',
        'account' => 'account',
        'orders' => 'orders',
    ] as $path => $page) {
        Route::get($path, PageController::class)->defaults('page', $page)->name('storefront.'.$page);
    }
});
