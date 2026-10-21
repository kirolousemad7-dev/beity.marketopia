<?php

use App\Http\Middleware\SetFilamentLocale;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/admin');
});

Route::get('/admin/locale/{locale}', function (string $locale) {
    abort_unless(in_array($locale, SetFilamentLocale::SUPPORTED_LOCALES, true), 404);

    session(['filament_locale' => $locale]);

    return redirect()->back();
})->middleware('auth')->name('admin.locale');