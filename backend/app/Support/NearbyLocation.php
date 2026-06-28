<?php

namespace App\Support;

/**
 * Random coordinates scattered within RADIUS_KM of São José do Rio Preto, SP.
 * Single source of truth for dev/test geolocation so seeders and dev-created
 * requests all cluster around one city — keeping the provider feed/matching
 * working against nearby points instead of a real device location that would
 * land far from the seeded data.
 */
class NearbyLocation
{
    /** São José do Rio Preto, SP — center for all dev/test locations. */
    public const CENTER_LAT = -20.8197;

    public const CENTER_LNG = -49.3794;

    /** Scatter radius around the center, in kilometers. */
    public const RADIUS_KM = 15.0;

    /**
     * A random ['latitude' => float, 'longitude' => float] uniformly distributed
     * within RADIUS_KM of the center. Spread straight into a model's attributes.
     *
     * @return array{latitude: float, longitude: float}
     */
    public static function random(): array
    {
        // Uniform over the disk: sqrt() on the radius avoids the clustering at
        // the center that a flat random radius would produce.
        $angle = self::randUnit() * 2 * M_PI;
        $radiusKm = self::RADIUS_KM * sqrt(self::randUnit());

        // ~111.32 km per degree of latitude; longitude shrinks by cos(lat).
        $dLat = ($radiusKm * cos($angle)) / 111.32;
        $dLng = ($radiusKm * sin($angle)) / (111.32 * cos(deg2rad(self::CENTER_LAT)));

        return [
            'latitude' => round(self::CENTER_LAT + $dLat, 6),
            'longitude' => round(self::CENTER_LNG + $dLng, 6),
        ];
    }

    /** A random float in [0, 1). */
    private static function randUnit(): float
    {
        return mt_rand() / (mt_getrandmax() + 1);
    }
}
