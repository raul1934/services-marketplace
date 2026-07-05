<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Filament\Resources\ProviderProfileResource\Pages\ListProviderProfiles;
use App\Filament\Resources\ServiceRequestResource\Pages\ListServiceRequests;
use App\Models\Market;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class MarketScopingTest extends TestCase
{
    use RefreshDatabase;

    private function requestIn(?Market $market): ServiceRequest
    {
        $client = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);

        return ServiceRequest::create([
            'client_id' => $client->id,
            'market_id' => $market?->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => 'open',
        ]);
    }

    private function providerIn(?Market $market): ProviderProfile
    {
        $provider = User::factory()->create();

        return ProviderProfile::create(['user_id' => $provider->id, 'market_id' => $market?->id]);
    }

    public function test_market_admin_only_sees_their_own_market(): void
    {
        $marketA = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $marketB = Market::create(['name' => 'B', 'geofence' => [['latitude' => 5, 'longitude' => 5], ['latitude' => 5, 'longitude' => 6], ['latitude' => 6, 'longitude' => 5]]]);

        $requestA = $this->requestIn($marketA);
        $requestB = $this->requestIn($marketB);
        $providerA = $this->providerIn($marketA);
        $providerB = $this->providerIn($marketB);

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::MarketAdmin]);
        $admin->markets()->sync([$marketA->id]);
        $this->actingAs($admin);

        Livewire::test(ListServiceRequests::class)
            ->assertCanSeeTableRecords([$requestA])
            ->assertCanNotSeeTableRecords([$requestB]);

        Livewire::test(ListProviderProfiles::class)
            ->assertCanSeeTableRecords([$providerA])
            ->assertCanNotSeeTableRecords([$providerB]);
    }

    public function test_super_admin_sees_every_market(): void
    {
        $marketA = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $marketB = Market::create(['name' => 'B', 'geofence' => [['latitude' => 5, 'longitude' => 5], ['latitude' => 5, 'longitude' => 6], ['latitude' => 6, 'longitude' => 5]]]);
        $requestA = $this->requestIn($marketA);
        $requestB = $this->requestIn($marketB);

        $superAdmin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $this->actingAs($superAdmin);

        Livewire::test(ListServiceRequests::class)
            ->assertCanSeeTableRecords([$requestA, $requestB]);
    }

    public function test_market_admin_with_no_assigned_markets_sees_nothing(): void
    {
        $market = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $request = $this->requestIn($market);

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::MarketAdmin]);
        $this->actingAs($admin);

        Livewire::test(ListServiceRequests::class)
            ->assertCanNotSeeTableRecords([$request]);
    }

    public function test_admin_without_a_role_cannot_access_the_panel(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'role' => null]);
        $panel = Filament::getPanel('admin');

        $this->assertFalse($admin->canAccessPanel($panel));
    }
}
