<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\ProposalNotAccepted;
use App\Services\ProposalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProposalNotAcceptedNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_losing_providers_are_notified_when_another_bid_is_accepted(): void
    {
        Event::fake();
        Notification::fake();

        $client = User::factory()->create();
        $winner = User::factory()->create();
        $loser = User::factory()->create();
        $withdrawnProvider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);
        $winning = Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $winner->id,
            'price' => 100, 'eta_minutes' => 10, 'status' => ProposalStatus::Pending->value,
        ]);
        Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $loser->id,
            'price' => 110, 'eta_minutes' => 12, 'status' => ProposalStatus::Pending->value,
        ]);
        // Already withdrawn before the accept — should NOT be flipped or notified.
        $withdrawn = Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $withdrawnProvider->id,
            'price' => 120, 'eta_minutes' => 20, 'status' => ProposalStatus::Withdrawn->value,
        ]);

        app(ProposalService::class)->accept($winning);

        Notification::assertSentTo($loser, ProposalNotAccepted::class);
        Notification::assertNotSentTo($winner, ProposalNotAccepted::class);
        Notification::assertNotSentTo($withdrawnProvider, ProposalNotAccepted::class);
        $this->assertSame(ProposalStatus::Withdrawn, $withdrawn->fresh()->status);
    }
}
