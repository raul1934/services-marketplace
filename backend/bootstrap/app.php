<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')->prefix('api')->group(base_path('routes/landing_api.php'));
            Route::middleware('api')->prefix('api')->group(base_path('routes/customer_api.php'));
            Route::middleware('api')->prefix('api')->group(base_path('routes/provider_api.php'));
        },
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['middleware' => ['auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Localize responses (validation + custom messages) from the X-Locale header.
        $middleware->api(prepend: [\App\Http\Middleware\SetLocale::class]);

        // Token-ability gates: a user holds a separate token per context
        // (client / provider / admin); these enforce which one a route accepts.
        $middleware->alias([
            'abilities' => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'ability' => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            'provider' => \App\Http\Middleware\EnsureProvider::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Token-based API + broadcasting auth must answer 401 JSON, never
        // redirect to a (non-existent) web `login` route.
        $exceptions->shouldRenderJsonWhen(
            fn ($request) => $request->is('api/*') || $request->is('broadcasting/auth') || $request->expectsJson()
        );
    })->create();
