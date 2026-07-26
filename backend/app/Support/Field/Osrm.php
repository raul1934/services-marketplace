<?php

namespace App\Support\Field;

use Illuminate\Support\Facades\Http;

/**
 * Thin OSRM client for drawing the route along real streets. Points at a free
 * OSRM endpoint (config services.osrm.url — the public demo by default; set
 * FIELD_OSRM_URL to a self-hosted one). Best-effort: any failure returns null
 * and the caller falls back to a straight line between stops.
 */
class Osrm
{
    /**
     * Road geometry through the given ordered stops.
     *
     * @param  array<int, array{0: float, 1: float}>  $coords  [lat, lng] pairs
     * @return array<int, array{latitude: float, longitude: float}>|null
     */
    public static function routeGeometry(array $coords): ?array
    {
        if (count($coords) < 2) {
            return null;
        }

        $base = rtrim((string) config('services.osrm.url'), '/');
        if ($base === '') {
            return null;
        }

        // OSRM wants lng,lat;lng,lat.
        $path = collect($coords)->map(fn ($c) => $c[1].','.$c[0])->implode(';');

        try {
            $res = Http::timeout(5)->get("{$base}/route/v1/driving/{$path}", [
                'overview' => 'full',
                'geometries' => 'geojson',
            ]);

            $line = $res->ok() ? $res->json('routes.0.geometry.coordinates') : null;
            if (! is_array($line)) {
                return null;
            }

            return array_map(fn ($p) => ['latitude' => (float) $p[1], 'longitude' => (float) $p[0]], $line);
        } catch (\Throwable) {
            return null;
        }
    }
}
