<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Interfaces\AuthInterface::class, \App\Services\Api\V1\AuthService::class);
        $this->app->bind(\App\Interfaces\ProductInterface::class, \App\Services\Api\V1\ProductService::class);
        $this->app->bind(\App\Interfaces\CategoryInterface::class, \App\Services\Api\V1\CategoryService::class);
        $this->app->bind(\App\Interfaces\OrderInterface::class, \App\Services\Api\V1\OrderService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 
    }
}
