<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BundleController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CouponController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::group(['prefix' => 'v1'], function () {
    Route::prefix('auth')->controller(AuthController::class)->group(function () {
        Route::post('login', 'login');
        Route::post('register', 'register');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('profile', 'profile');
            Route::put('profile', 'updateProfile');
            Route::post('logout', 'logout');
            Route::delete('delete-account', 'deleteAccount');
        });
    });

    Route::get('settings', [SettingController::class, 'index']);

    Route::middleware(['api.locale'])->group(function () {
        Route::group(['controller' => ProductController::class, 'prefix' => 'products'], function () {
            Route::get('/', 'index');
            Route::get('best-selling', 'bestSelling');
            Route::get('/{slug}', 'show');
        });

        Route::group(['controller' => CategoryController::class, 'prefix' => 'categories'], function () {
            Route::get('/', 'index');
            Route::get('/{id}', 'show');
        });

        Route::group(['controller' => BundleController::class, 'prefix' => 'bundles'], function () {
            Route::get('/', 'index');
            Route::get('/{slug}', 'show');
        });

        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('/coupons/apply', [CouponController::class, 'apply']);
            
            Route::group(['controller' => OrderController::class, 'prefix' => 'orders'], function () {
                Route::get('/', 'index');
                Route::post('checkout', 'checkout');
            });
        });
    });
});
