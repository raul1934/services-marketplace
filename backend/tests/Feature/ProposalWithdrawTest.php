<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProposalWithdrawTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: Proposal} */
    private function openWithBid(): array
    {
        Notification::fake();
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

    public function test_provider_can_withdraw_their_own_pending_bid(): void
    {
        [$request, $provider, $proposal] = $this->openWithBid();
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/proposals/{$proposal->id}/withdraw")->assertOk();

        $this->assertSame(ProposalStatus::Withdrawn, $proposal->fresh()->status);

        // No longer visible to the client's proposal picker.
        Sanctum::actingAs($request->client, ['client']);
        $ids = $this->getJson("/api/customer/v1/requests/{$request->id}/proposals")->json('data.*.id');
        $this->assertNotContains($proposal->id, $ids);
    }

    public function test_provider_cannot_withdraw_another_providers_bid(): void
    {
        [, , $proposal] = $this->openWithBid();
        $other = User::factory()->create();
        Sanctum::actingAs($other, ['provider']);

        $this->postJson("/api/provider/v1/proposals/{$proposal->id}/withdraw")->assertForbidden();
    }

    public function test_accepted_bid_cannot_be_withdrawn(): void
    {
        [, $provider, $proposal] = $this->openWithBid();
        $proposal->update(['status' => ProposalStatus::Accepted->value]);
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/proposals/{$proposal->id}/withdraw")->assertStatus(422);
    }
}
