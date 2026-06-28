<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProvider
{
    /** Restrict a route to users who registered as providers. */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_provider) {
            abort(403, 'Esta ação é exclusiva para prestadores.');
        }

        return $next($request);
    }
}
