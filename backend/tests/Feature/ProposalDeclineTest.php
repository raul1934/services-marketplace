<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\ProposalDeclined;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProposalDeclineTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: Proposal} */
    private function openWithBid(): array
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
        ]);
        $proposal = Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'price' => 100, 'eta_minutes' => 10, 'status' => ProposalStatus::Pending->value,
        ]);

        return [$request, $provider, $proposal];
    }

    public function test_client_can_decline_a_single_proposal(): void
    {
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid();
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/proposals/{$proposal->id}/decline")->assertOk();

        $this->assertSame(ProposalStatus::Declined, $proposal->fresh()->status);
        Notification::assertSentTo($provider, ProposalDeclined::class);

        $ids = $this->getJson("/api/customer/v1/requests/{$request->id}/proposals")->json('data.*.id');
        $this->assertNotContains($proposal->id, $ids);
    }

    public function test_declining_leaves_other_proposals_untouched(): void
    {
        Notification::fake();
        [$request, , $proposal] = $this->openWithBid();
        $otherProvider = User::factory()->create();
        $other = Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $otherProvider->id,
            'price' => 90, 'eta_minutes' => 15, 'status' => ProposalStatus::Pending->value,
        ]);
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/proposals/{$proposal->id}/decline")->assertOk();

        $this->assertSame(ProposalStatus::Pending, $other->fresh()->status);
    }

    public function test_cannot_decline_someone_elses_request(): void
    {
        [, , $proposal] = $this->openWithBid();
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger, ['client']);

        $this->postJson("/api/customer/v1/proposals/{$proposal->id}/decline")->assertForbidden();
    }
}
