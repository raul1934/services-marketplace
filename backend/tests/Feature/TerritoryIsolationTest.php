<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Exceptions\OutOfCoverageException;
use App\Jobs\DispatchNewRequestToProviders;
use App\Models\CoverageLead;
use App\Models\Market;
use App\Models\ProviderLocation;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\MatchingService;
use App\Services\ProviderService;
use App\Services\RequestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * Territory isolation: with matching.territory_isolation on, dispatch + the
 * provider feed are confined to a request's Market (franchise exclusivity), a
 * provider's market is fixed after first assignment, and out-of-coverage
 * requests are blocked + captured. Two *adjacent* markets (well within the
 * 30 km radius) prove it's the market boundary doing the work, not distance.
 */
class TerritoryIsolationTest extends TestCase
{
    use RefreshDatabase;

    /** A tiny square market. */
    private function market(string $name, float $lat, float $lng, float $half = 0.02): Market
    {
        return Market::create([
            'name' => $name,
            'is_active' => true,
            'geofence' => [
                ['latitude' => $lat - $half, 'longitude' => $lng - $half],
                ['latitude' => $lat - $half, 'longitude' => $lng + $half],
                ['latitude' => $lat + $half, 'longitude' => $lng + $half],
                ['latitude' => $lat + $half, 'longitude' => $lng - $half],
            ],
        ]);
    }

    private function category(): ServiceCategory
    {
        return ServiceCategory::create(['type' => 'roadside', 'slug' => 'tow', 'name' => 'Guincho', 'sort_order' => 1, 'is_active' => true]);
    }

    private function onlineProvider(Market $market, float $lat, float $lng, int $categoryId): User
    {
        $u = User::factory()->create(['is_provider' => true]);
        ProviderProfile::create(['user_id' => $u->id, 'market_id' => $market->id, 'is_online' => true, 'is_approved' => true]);
        ProviderLocation::create(['user_id' => $u->id, 'latitude' => $lat, 'longitude' => $lng]);
        $u->categories()->sync([$categoryId]);

        return $u;
    }

    private function openRequest(User $client, ?Market $market, float $lat, float $lng, int $categoryId): ServiceRequest
    {
        return ServiceRequest::create([
            'client_id' => $client->id,
            'market_id' => $market?->id,
            'service_category_id' => $categoryId,
            'description' => 'x',
            'latitude' => $lat,
            'longitude' => $lng,
            'status' => RequestStatus::Open->value,
            'urgency' => RequestUrgency::Urgent->value,
        ]);
    }

    public function test_dispatch_is_confined_to_the_requests_market(): void
    {
        config(['matching.territory_isolation' => true]);
        // Adjacent markets ~5 km apart — a provider in A is within radius of a B request.
        $a = $this->market('A', -20.825, -49.395);
        $b = $this->market('B', -20.775, -49.395);
        $cat = $this->category();
        $client = User::factory()->create();

        $providerA = $this->onlineProvider($a, -20.825, -49.395, $cat->id);
        $providerB = $this->onlineProvider($b, -20.775, -49.395, $cat->id);

        $request = $this->openRequest($client, $b, -20.775, -49.395, $cat->id);
        $ids = app(MatchingService::class)->onlineProvidersNear($request)->pluck('id');

        $this->assertTrue($ids->contains($providerB->id), 'provider in the market should be dispatched');
        $this->assertFalse($ids->contains($providerA->id), 'provider in a neighbouring market must NOT be dispatched');
    }

    public function test_radius_only_when_isolation_is_off_crosses_the_border(): void
    {
        config(['matching.territory_isolation' => false]);
        $a = $this->market('A', -20.825, -49.395);
        $b = $this->market('B', -20.775, -49.395);
        $cat = $this->category();
        $client = User::factory()->create();

        $providerA = $this->onlineProvider($a, -20.825, -49.395, $cat->id);
        $request = $this->openRequest($client, $b, -20.775, -49.395, $cat->id);

        $ids = app(MatchingService::class)->onlineProvidersNear($request)->pluck('id');
        $this->assertTrue($ids->contains($providerA->id), 'radius-only mode ignores the border');
    }

    public function test_provider_feed_only_shows_its_own_market(): void
    {
        config(['matching.territory_isolation' => true]);
        $a = $this->market('A', -20.825, -49.395);
        $b = $this->market('B', -20.775, -49.395);
        $cat = $this->category();
        $client = User::factory()->create();

        $providerB = $this->onlineProvider($b, -20.775, -49.395, $cat->id);
        $reqA = $this->openRequest($client, $a, -20.825, -49.395, $cat->id);
        $reqB = $this->openRequest($client, $b, -20.775, -49.395, $cat->id);

        $ids = app(MatchingService::class)->openRequestsNear($providerB)->pluck('id');
        $this->assertTrue($ids->contains($reqB->id));
        $this->assertFalse($ids->contains($reqA->id), "another market's request must not appear in the feed");
    }

    public function test_provider_market_is_assigned_once_then_fixed(): void
    {
        $a = $this->market('A', -20.825, -49.395);
        $b = $this->market('B', -20.775, -49.395);
        $u = User::factory()->create(['is_provider' => true]);
        ProviderProfile::create(['user_id' => $u->id]); // no market yet

        $svc = app(ProviderService::class);
        $svc->updateLocation($u, ['latitude' => -20.825, 'longitude' => -49.395]);
        $this->assertSame($a->id, $u->providerProfile->fresh()->market_id, 'first location assigns the market');

        // A later ping that falls in market B must NOT move the provider's territory.
        $svc->updateLocation($u, ['latitude' => -20.775, 'longitude' => -49.395]);
        $this->assertSame($a->id, $u->providerProfile->fresh()->market_id, 'territory stays fixed after the first ping');
    }

    public function test_out_of_coverage_request_is_blocked_and_recorded_as_a_lead(): void
    {
        config(['matching.territory_isolation' => true]);
        Bus::fake();
        $this->market('A', -20.825, -49.395); // the only market
        $cat = $this->category();
        $client = User::factory()->create();

        try {
            app(RequestService::class)->create($client, [
                'service_category_id' => $cat->id,
                'description' => 'preciso de guincho',
                'latitude' => 10.0, // far outside every geofence
                'longitude' => 10.0,
            ]);
            $this->fail('expected OutOfCoverageException');
        } catch (OutOfCoverageException $e) {
            // expected
        }

        $this->assertSame(0, ServiceRequest::count(), 'no orphan request is created');
        $this->assertSame(1, CoverageLead::where('client_id', $client->id)->where('service_category_id', $cat->id)->count());
        Bus::assertNotDispatched(DispatchNewRequestToProviders::class);
    }
}
