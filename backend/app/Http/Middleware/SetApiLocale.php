<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetApiLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', config('app.locale'));
        $locale = strtolower(strtok($locale, ',') ?: config('app.locale'));
        $locale = strtok($locale, '-') ?: config('app.locale');

        app()->setLocale(in_array($locale, ['en', 'ar'], true) ? $locale : config('app.fallback_locale'));

        return $next($request);
    }
}
