<?php

namespace Tests\Feature;

use App\Enums\CounterOfferStatus;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\CounterOfferDeclined;
use App\Notifications\NewCounterOffer;
use App\Notifications\NewProposalForClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CounterOfferTest extends TestCase
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

    public function test_client_can_counter_and_provider_can_accept(): void
    {
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid();
        Sanctum::actingAs($request->client, ['client']);

        $res = $this->postJson("/api/customer/v1/proposals/{$proposal->id}/counter", ['price' => 80, 'message' => 'Consegue por 80?'])
            ->assertCreated();
        Notification::assertSentTo($provider, NewCounterOffer::class);

        $counterId = $res->json('id');
        Sanctum::actingAs($provider, ['provider']);
        $this->postJson("/api/provider/v1/counter-offers/{$counterId}/accept")->assertOk();

        $this->assertSame(80.0, (float) $proposal->fresh()->price);
        Notification::assertSentTo($request->client, NewProposalForClient::class);
    }

    public function test_client_can_counter_and_provider_can_decline(): void
    {
        Notification::fake();
        [$request, $provider, $proposal] = $this->openWithBid();
        Sanctum::actingAs($request->client, ['client']);

        $res = $this->postJson("/api/customer/v1/proposals/{$proposal->id}/counter", ['price' => 80])->assertCreated();
        $counterId = $res->json('id');

        Sanctum::actingAs($provider, ['provider']);
        $this->postJson("/api/provider/v1/counter-offers/{$counterId}/decline")->assertOk();

        $this->assertSame(100.0, (float) $proposal->fresh()->price);
        Notification::assertSentTo($request->client, CounterOfferDeclined::class);
    }

    public function test_a_second_counter_replaces_the_pending_one(): void
    {
        Notification::fake();
        [$request, , $proposal] = $this->openWithBid();
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/proposals/{$proposal->id}/counter", ['price' => 80])->assertCreated();
        $this->postJson("/api/customer/v1/proposals/{$proposal->id}/counter", ['price' => 85])->assertCreated();

        $this->assertSame(1, $proposal->fresh()->counterOffers()->where('status', CounterOfferStatus::Pending->value)->count());
    }
}
