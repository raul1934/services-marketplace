<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
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
            'urgency' => RequestUrgency::Urgent->value,
            'max_wait_minutes' => 30,
            // Past the window the client agreed to wait — a no-show is only
            // reportable once the provider is actually late.
            'accepted_at' => now()->subMinutes(45),
        ]);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/no-show")->assertOk();

        $this->assertSame(RequestStatus::Open, $request->fresh()->status);
        $this->assertSame(1, $provider->providerProfile->fresh()->no_show_count);
    }

    /** @return array{0: ServiceRequest, 1: User} */
    private function acceptedRequest(array $overrides = []): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        ProviderProfile::create(['user_id' => $provider->id, 'no_show_count' => 0]);
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);

        $request = ServiceRequest::create(array_merge([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Accepted->value,
            'accepted_provider_id' => $provider->id,
            'urgency' => RequestUrgency::Urgent->value,
            'max_wait_minutes' => 30,
            'accepted_at' => now()->subMinutes(45),
        ], $overrides));

        return [$request, $client];
    }

    /** Premature: the provider still has time on the clock they were given. */
    public function test_a_no_show_cannot_be_reported_inside_the_promised_window(): void
    {
        Bus::fake();
        Notification::fake();
        [$request, $client] = $this->acceptedRequest(['accepted_at' => now()->subMinutes(5)]);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/no-show")->assertStatus(422);
        $this->assertSame(RequestStatus::Accepted, $request->fresh()->status);
    }

    /** They demonstrably showed up — the job is under way. */
    public function test_a_no_show_cannot_be_reported_once_the_provider_is_on_site(): void
    {
        Bus::fake();
        Notification::fake();
        [$request, $client] = $this->acceptedRequest([
            'status' => RequestStatus::InProgress->value,
            'started_at' => now()->subMinutes(2),
        ]);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/no-show")->assertStatus(422);
        $this->assertSame(RequestStatus::InProgress, $request->fresh()->status);
    }

    public function test_the_payload_tells_the_app_when_the_actions_unlock(): void
    {
        [$early, $client] = $this->acceptedRequest(['accepted_at' => now()->subMinutes(5)]);
        Sanctum::actingAs($client, ['client']);

        $this->getJson("/api/customer/v1/requests/{$early->id}")
            ->assertOk()
            ->assertJsonPath('data.can_report_no_show', false)
            ->assertJsonPath('data.can_reschedule', false);

        $early->update(['accepted_at' => now()->subMinutes(45)]);

        $this->getJson("/api/customer/v1/requests/{$early->id}")
            ->assertOk()
            ->assertJsonPath('data.can_report_no_show', true)
            ->assertJsonPath('data.can_reschedule', true);
    }
}
