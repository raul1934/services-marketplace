<?php

namespace App\Support\Field;

use Illuminate\Support\Facades\Http;

/**
 * Current temperature for a point, from the free Open-Meteo API (no key).
 * Best-effort: returns null when offline or on any failure.
 */
class Weather
{
    public static function currentTemp(?float $lat, ?float $lng): ?int
    {
        if ($lat === null || $lng === null) {
            return null;
        }

        try {
            $res = Http::timeout(4)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $lat,
                'longitude' => $lng,
                'current' => 'temperature_2m',
            ]);

            $temp = $res->ok() ? $res->json('current.temperature_2m') : null;

            return is_numeric($temp) ? (int) round($temp) : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
