<?php

namespace Tests\Feature;

use App\Models\Market;
use App\Services\MatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketMatchingTest extends TestCase
{
    use RefreshDatabase;

    /** A rough square around São José do Rio Preto. */
    private function riopreto(): Market
    {
        return Market::create([
            'name' => 'Rio Preto',
            'geofence' => [
                ['latitude' => -20.70, 'longitude' => -49.50],
                ['latitude' => -20.70, 'longitude' => -49.20],
                ['latitude' => -21.00, 'longitude' => -49.20],
                ['latitude' => -21.00, 'longitude' => -49.50],
            ],
        ]);
    }

    public function test_point_inside_the_polygon_matches(): void
    {
        $market = $this->riopreto();

        $found = app(MatchingService::class)->marketFor(-20.82, -49.38);

        $this->assertNotNull($found);
        $this->assertSame($market->id, $found->id);
    }

    public function test_point_outside_every_polygon_returns_null(): void
    {
        $this->riopreto();

        $found = app(MatchingService::class)->marketFor(10.0, 10.0);

        $this->assertNull($found);
    }

    public function test_inactive_market_is_ignored(): void
    {
        Market::create([
            'name' => 'Inactive',
            'is_active' => false,
            'geofence' => [
                ['latitude' => -20.70, 'longitude' => -49.50],
                ['latitude' => -20.70, 'longitude' => -49.20],
                ['latitude' => -21.00, 'longitude' => -49.20],
            ],
        ]);

        $found = app(MatchingService::class)->marketFor(-20.82, -49.38);

        $this->assertNull($found);
    }

    public function test_market_without_a_geofence_is_ignored(): void
    {
        Market::create(['name' => 'No boundary yet', 'geofence' => null]);

        $found = app(MatchingService::class)->marketFor(-20.82, -49.38);

        $this->assertNull($found);
    }

    public function test_fewer_than_three_points_never_matches(): void
    {
        Market::create([
            'name' => 'Just a line',
            'geofence' => [
                ['latitude' => -20.70, 'longitude' => -49.50],
                ['latitude' => -21.00, 'longitude' => -49.20],
            ],
        ]);

        $found = app(MatchingService::class)->marketFor(-20.82, -49.38);

        $this->assertNull($found);
    }

    public function test_overlapping_polygons_pick_the_nearest_centroid(): void
    {
        $near = Market::create([
            'name' => 'Near',
            'geofence' => [
                ['latitude' => -20.70, 'longitude' => -49.50],
                ['latitude' => -20.70, 'longitude' => -49.20],
                ['latitude' => -21.00, 'longitude' => -49.20],
                ['latitude' => -21.00, 'longitude' => -49.50],
            ],
        ]);
        // A much larger polygon that also contains the same test point.
        Market::create([
            'name' => 'Far but huge',
            'geofence' => [
                ['latitude' => -19.0, 'longitude' => -51.0],
                ['latitude' => -19.0, 'longitude' => -47.0],
                ['latitude' => -23.0, 'longitude' => -47.0],
                ['latitude' => -23.0, 'longitude' => -51.0],
            ],
        ]);

        $found = app(MatchingService::class)->marketFor(-20.82, -49.38);

        $this->assertSame($near->id, $found->id);
    }
}
