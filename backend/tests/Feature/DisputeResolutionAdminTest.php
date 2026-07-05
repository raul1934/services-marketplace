<?php

namespace Tests\Feature;

use App\Enums\AdminRole;
use App\Enums\DisputeStatus;
use App\Filament\Resources\DisputeResource\Pages\ListDisputes;
use App\Models\Market;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\DisputeResolved;
use App\Services\DisputeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Livewire\Livewire;
use Tests\TestCase;

class DisputeResolutionAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolving_a_dispute_releases_the_held_split_and_notifies_both_parties(): void
    {
        Notification::fake();

        $market = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'market_id' => $market->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => 'completed',
            'accepted_provider_id' => $provider->id,
        ]);
        WalletTransaction::create([
            'provider_id' => $provider->id, 'market_id' => $market->id, 'type' => WalletTransaction::TYPE_CREDIT,
            'amount' => 100, 'service_request_id' => $request->id,
        ]);

        $dispute = app(DisputeService::class)->open($request, $client, 'The service was not done correctly');
        $this->assertSame(WalletTransaction::STATUS_HELD, WalletTransaction::where('service_request_id', $request->id)->first()->status);

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::SuperAdmin]);
        $this->actingAs($admin);

        Livewire::test(ListDisputes::class)
            ->callTableAction('resolve', $dispute, data: ['resolution' => 'Refund partially issued.'])
            ->assertHasNoTableActionErrors();

        $this->assertSame(DisputeStatus::Resolved, $dispute->fresh()->status);
        $this->assertSame(WalletTransaction::STATUS_COMPLETED, WalletTransaction::where('service_request_id', $request->id)->first()->status);
        Notification::assertSentTo($client, DisputeResolved::class);
        Notification::assertSentTo($provider, DisputeResolved::class);
    }

    public function test_market_admin_cannot_resolve_a_dispute_outside_their_market(): void
    {
        $marketA = Market::create(['name' => 'A', 'geofence' => [['latitude' => 0, 'longitude' => 0], ['latitude' => 0, 'longitude' => 1], ['latitude' => 1, 'longitude' => 0]]]);
        $marketB = Market::create(['name' => 'B', 'geofence' => [['latitude' => 5, 'longitude' => 5], ['latitude' => 5, 'longitude' => 6], ['latitude' => 6, 'longitude' => 5]]]);
        $client = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'market_id' => $marketB->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => 'completed',
        ]);
        $dispute = app(DisputeService::class)->open($request, $client, 'Claim');

        $admin = User::factory()->create(['is_admin' => true, 'role' => AdminRole::MarketAdmin]);
        $admin->markets()->sync([$marketA->id]);
        $this->actingAs($admin);

        Livewire::test(ListDisputes::class)->assertCanNotSeeTableRecords([$dispute]);
    }
}
