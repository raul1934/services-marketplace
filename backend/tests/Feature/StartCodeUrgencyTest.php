<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\ProposalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StartCodeUrgencyTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: Proposal} */
    private function openWithBid(RequestUrgency $urgency): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
            'urgency' => $urgency->value,
        ]);
        $proposal = Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 10, 'status' => ProposalStatus::Pending->value,
        ]);

        return [$request, $provider, $proposal];
    }

    public function test_urgent_accept_generates_a_start_code(): void
    {
        Event::fake();
        Notification::fake();
        [, , $proposal] = $this->openWithBid(RequestUrgency::Urgent);

        $request = app(ProposalService::class)->accept($proposal);

        $this->assertNotNull($request->start_code);
        $this->assertSame(4, strlen((string) $request->start_code));
    }

    public function test_scheduled_accept_has_no_start_code(): void
    {
        Event::fake();
        Notification::fake();
        [, , $proposal] = $this->openWithBid(RequestUrgency::Scheduled);

        $request = app(ProposalService::class)->accept($proposal);

        $this->assertNull($request->start_code);
    }

    public function test_urgent_job_cannot_start_without_the_code(): void
    {
        Event::fake();
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid(RequestUrgency::Urgent);
        app(ProposalService::class)->accept($proposal);
        Sanctum::actingAs($provider, ['provider']);

        $this->putJson("/api/provider/v1/requests/{$request->id}/status", ['status' => 'in_progress'])
            ->assertStatus(422);

        $this->assertSame(RequestStatus::Accepted, $request->fresh()->status);
    }

    public function test_urgent_job_starts_with_the_correct_code(): void
    {
        Event::fake();
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid(RequestUrgency::Urgent);
        $accepted = app(ProposalService::class)->accept($proposal);
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/start", ['code' => $accepted->start_code])
            ->assertOk();

        $this->assertSame(RequestStatus::InProgress, $request->fresh()->status);
    }

    public function test_scheduled_job_starts_without_a_code(): void
    {
        Event::fake();
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid(RequestUrgency::Scheduled);
        app(ProposalService::class)->accept($proposal);
        Sanctum::actingAs($provider, ['provider']);

        $this->putJson("/api/provider/v1/requests/{$request->id}/status", ['status' => 'in_progress'])
            ->assertOk();

        $this->assertSame(RequestStatus::InProgress, $request->fresh()->status);
    }
}
