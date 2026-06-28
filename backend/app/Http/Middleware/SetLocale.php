<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets the app locale per request from the `X-Locale` header (the mobile/web
 * client sends 'pt' or 'en'). Falls back to Accept-Language, then the app
 * default. `X-Locale` is used because browsers forbid setting Accept-Language
 * via fetch.
 */
class SetLocale
{
    private const SUPPORTED = ['pt', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('X-Locale')
            ?? substr((string) $request->header('Accept-Language'), 0, 2);

        $locale = strtolower((string) $locale);

        if (in_array($locale, self::SUPPORTED, true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
