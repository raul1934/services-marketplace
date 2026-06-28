<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Events\RequestStatusUpdated;
use App\Events\SurchargeProposed as SurchargeProposedEvent;
use App\Events\SurchargeResolved as SurchargeResolvedEvent;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use App\Notifications\RequoteRequired;
use App\Notifications\SurchargeProposed as SurchargeProposedNotification;
use App\Notifications\SurchargeResolved as SurchargeResolvedNotification;
use App\Services\SurchargeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SurchargeFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User} */
    private function makeActiveJob(float $price = 100): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value,
            'accepted_provider_id' => $provider->id,
        ]);
        $proposal = Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => $price, 'eta_minutes' => 10,
            'status' => ProposalStatus::Accepted->value,
        ]);
        $request->update(['accepted_proposal_id' => $proposal->id]);

        return [$request->fresh(), $client, $provider];
    }

    public function test_propose_dispatches_event_and_notifies_client_at_simple_tier(): void
    {
        Event::fake([SurchargeProposedEvent::class, RequestStatusUpdated::class]);
        Notification::fake();
        [$request, $client] = $this->makeActiveJob(100);

        $s = app(SurchargeService::class)->propose($request, $request->provider, [
            'amount' => 10, 'reason' => 'extra', 'photos' => ['p.jpg'],
        ]);

        $this->assertSame(SurchargeTier::Simple, $s->tier);
        $this->assertEquals(10.0, (float) $s->percent_accumulated);
        Event::assertDispatched(SurchargeProposedEvent::class);
        Notification::assertSentTo($client, SurchargeProposedNotification::class);
        Event::assertNotDispatched(RequestStatusUpdated::class);
    }

    public function test_surcharge_over_50_percent_triggers_requote(): void
    {
        Event::fake([SurchargeProposedEvent::class, RequestStatusUpdated::class]);
        Notification::fake();
        [$request, $client] = $this->makeActiveJob(100);

        $s = app(SurchargeService::class)->propose($request, $request->provider, [
            'amount' => 60, 'reason' => 'much bigger job', 'photos' => ['p.jpg'],
        ]);

        $this->assertSame(SurchargeTier::Requote, $s->tier);
        $this->assertSame(RequestStatus::Requote, $request->fresh()->status);
        Notification::assertSentTo($client, RequoteRequired::class);
        Event::assertDispatched(RequestStatusUpdated::class);
    }

    public function test_approve_resolves_and_notifies_provider(): void
    {
        Event::fake([SurchargeResolvedEvent::class]);
        Notification::fake();
        [$request, , $provider] = $this->makeActiveJob(100);
        $s = Surcharge::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'amount' => 10, 'reason' => 'x', 'percent_accumulated' => 10,
            'tier' => SurchargeTier::Simple->value, 'status' => SurchargeStatus::Pending->value,
        ]);

        app(SurchargeService::class)->approve($s);

        $this->assertSame(SurchargeStatus::Approved, $s->fresh()->status);
        Notification::assertSentTo($provider, SurchargeResolvedNotification::class);
        Event::assertDispatched(SurchargeResolvedEvent::class);
    }
}
