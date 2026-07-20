<?php

namespace App\Support;

/**
 * Polygon helpers for Market geofences. Both operate on the same shape used by
 * Market::$geofence and AssetProperty: an array of {latitude, longitude}
 * points, treated as plane coordinates (accurate enough at city scale).
 *
 * Extracted from MatchingService so the containment test has a single home and
 * can be reused for the inverse operation (sampling a point inside a polygon).
 */
class Geofence
{
    /**
     * Standard ray-casting point-in-polygon test: count how many times a ray
     * cast from the point to infinity crosses the polygon's edges — odd means
     * inside, even means outside.
     *
     * @param  array<array{latitude:float,longitude:float}>  $polygon
     */
    public static function contains(float $lat, float $lng, array $polygon): bool
    {
        $polygon = array_values($polygon);
        $count = count($polygon);
        if ($count < 3) {
            return false;
        }

        $inside = false;
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $latI = (float) $polygon[$i]['latitude'];
            $lngI = (float) $polygon[$i]['longitude'];
            $latJ = (float) $polygon[$j]['latitude'];
            $lngJ = (float) $polygon[$j]['longitude'];

            $intersects = ($latI > $lat) !== ($latJ > $lat)
                && $lng < ($lngJ - $lngI) * ($lat - $latI) / ($latJ - $latI) + $lngI;

            if ($intersects) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * A random point inside the polygon, by rejection sampling over its bounding
     * box. Rejection sampling (rather than triangulating the polygon) keeps this
     * short and is fine for the roughly-rectangular city geofences in use: a
     * convex-ish shape fills most of its bbox, so it usually lands on the first
     * few tries.
     *
     * Returns null when the polygon is degenerate or when $maxTries draws all
     * miss (a pathological sliver) — callers should fall back to the centroid
     * rather than assume success.
     *
     * @param  array<array{latitude:float,longitude:float}>  $polygon
     * @return array{latitude: float, longitude: float}|null
     */
    public static function randomPointInside(array $polygon, int $maxTries = 200): ?array
    {
        $polygon = array_values($polygon);
        if (count($polygon) < 3) {
            return null;
        }

        $lats = array_map(fn ($p) => (float) $p['latitude'], $polygon);
        $lngs = array_map(fn ($p) => (float) $p['longitude'], $polygon);

        [$latMin, $latMax] = [min($lats), max($lats)];
        [$lngMin, $lngMax] = [min($lngs), max($lngs)];

        for ($i = 0; $i < $maxTries; $i++) {
            $lat = $latMin + self::randUnit() * ($latMax - $latMin);
            $lng = $lngMin + self::randUnit() * ($lngMax - $lngMin);

            if (self::contains($lat, $lng, $polygon)) {
                // 6 decimals ≈ 11 cm, and the column is decimal(10,7).
                return ['latitude' => round($lat, 6), 'longitude' => round($lng, 6)];
            }
        }

        return null;
    }

    /** A random float in [0, 1). Mirrors NearbyLocation::randUnit(). */
    private static function randUnit(): float
    {
        return mt_rand() / (mt_getrandmax() + 1);
    }
}
