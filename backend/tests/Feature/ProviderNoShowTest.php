<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProviderNoShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporting_a_provider_no_show_increments_their_reputation_count(): void
    {
        // reportNoShow() re-dispatches to nearby providers; the haversine SQL it
        // uses is Postgres-only (least/greatest/acos), so fake the bus rather
        // than let it run against the sqlite test database.
        Bus::fake();
        Notification::fake();
        $client = User::factory()->create();
        $provider = User::factory()->create();
        ProviderProfile::create(['user_id' => $provider->id, 'no_show_count' => 0]);
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Accepted->value,
            'accepted_provider_id' => $provider->id,
        ]);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/no-show")->assertOk();

        $this->assertSame(RequestStatus::Open, $request->fresh()->status);
        $this->assertSame(1, $provider->providerProfile->fresh()->no_show_count);
    }
}
