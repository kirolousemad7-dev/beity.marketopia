<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*')) {
                // Prevent redirection and immediately force a 401 response
                abort(response()->json([
                    'success' => false,
                    'message' => __('Unauthenticated.'),
                    'errors' => ['authentication' => ['A valid bearer token is required.']],
                ], 401));
            }
        });

        $middleware->alias([
            'api.locale' => \App\Http\Middleware\SetApiLocale::class
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => ($request->is('api/*') || $request->expectsJson()),
        );

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => __('The given data was invalid.'),
                'errors' => $exception->errors(),
            ], $exception->status);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => __('Unauthenticated.'),
                'errors' => ['authentication' => ['A valid bearer token is required.']],
            ], 401);
        });

        $exceptions->render(function (RouteNotFoundException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => __($exception->getMessage() ?: 'Route not found.'),
                'errors' => null,
            ], 404);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage() ?: match ($exception->getStatusCode()) {
                    403 => __('Forbidden.'),
                    404 => __('Resource not found.'),
                    default => __('Request failed.'),
                },
                'errors' => null,
            ], $exception->getStatusCode());
        });
        
    })->create();
