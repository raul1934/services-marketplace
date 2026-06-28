<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Models\JobPart;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RequestEventFeedTest extends TestCase
{
    use RefreshDatabase;

    private function category(int $seed): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$seed, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
    }

    public function test_feed_aggregates_events_in_chronological_order(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $this->category($client->id)->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
            'accepted_provider_id' => $provider->id,
            'accepted_at' => now()->addMinutes(5),
            'started_at' => now()->addMinutes(10),
            'completed_at' => now()->addMinutes(15),
        ]);
        $proposal = Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 140, 'eta_minutes' => 10,
            'status' => ProposalStatus::Accepted->value,
        ]);
        $request->update(['accepted_proposal_id' => $proposal->id]);
        JobPart::create([
            'service_request_id' => $request->id, 'name' => 'pad', 'action' => 'added', 'quantity' => 2, 'unit_price' => 20,
        ]);
        Surcharge::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'amount' => 10, 'reason' => 'x', 'percent_accumulated' => 10,
            'tier' => SurchargeTier::Simple->value, 'status' => SurchargeStatus::Approved->value,
            'resolved_at' => now()->addMinutes(12),
        ]);

        Sanctum::actingAs($client, ['client']);

        $res = $this->getJson("/api/customer/v1/requests/{$request->id}/events")->assertOk();
        $events = $res->json('data');

        $types = array_column($events, 'type');
        $this->assertContains('request_created', $types);
        $this->assertContains('proposal_received', $types);
        $this->assertContains('proposal_accepted', $types);
        $this->assertContains('job_started', $types);
        $this->assertContains('part_added', $types);
        $this->assertContains('surcharge_proposed', $types);
        $this->assertContains('job_completed', $types);

        // Ascending by time (the feed is rendered oldest → newest).
        $ats = array_column($events, 'at');
        $sorted = $ats;
        sort($sorted);
        $this->assertSame($sorted, $ats);

        // The approved value rides on the proposal_accepted event.
        $accepted = collect($events)->firstWhere('type', 'proposal_accepted');
        $this->assertEqualsWithDelta(140.0, $accepted['amount'], 0.001);
    }

    public function test_open_request_only_shows_what_has_happened(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $this->category($client->id)->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);
        Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 10, 'status' => ProposalStatus::Pending->value,
        ]);

        Sanctum::actingAs($client, ['client']);

        $types = array_column(
            $this->getJson("/api/customer/v1/requests/{$request->id}/events")->assertOk()->json('data'),
            'type',
        );

        $this->assertSame(['request_created', 'proposal_received'], $types);
        $this->assertNotContains('job_started', $types);
        $this->assertNotContains('job_completed', $types);
    }

    public function test_events_are_owner_scoped(): void
    {
        $client = User::factory()->create();
        $stranger = User::factory()->create();
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $this->category($client->id)->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);

        Sanctum::actingAs($stranger, ['client']);

        $this->getJson("/api/customer/v1/requests/{$request->id}/events")->assertStatus(403);
    }
}
