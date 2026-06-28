<?php

namespace Database\Seeders\Concerns;

use App\Support\NearbyLocation;

/**
 * Convenience wrapper so seeders can spread a random São José do Rio Preto
 * location straight into a model's attributes. Delegates to NearbyLocation,
 * which is the single source of truth (shared with dev request creation).
 * Non-deterministic by design: re-seeding reshuffles the locations.
 */
trait SeedsNearbyLocations
{
    /**
     * A random ['latitude' => float, 'longitude' => float] near the dev center.
     *
     * @return array{latitude: float, longitude: float}
     */
    protected function randomNearbyLocation(): array
    {
        return NearbyLocation::random();
    }
}
