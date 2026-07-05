<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\RequestQuestion;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A provider's pre-bid questions are only visible/answerable to the client once
 * that provider has published a bid (a live proposal on the request).
 */
class CustomerQuestionVisibilityTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User} */
    private function makeOpenRequest(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $provider->categories()->attach($category->id);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);

        return [$request->fresh(), $client, $provider];
    }

    private function bid(ServiceRequest $request, User $provider): Proposal
    {
        return Proposal::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'price' => 120, 'eta_minutes' => 20, 'status' => ProposalStatus::Pending->value,
        ]);
    }

    public function test_client_sees_questions_only_from_providers_who_published_a_bid(): void
    {
        [$request, $client, $bidder] = $this->makeOpenRequest();
        $lurker = User::factory()->create();

        RequestQuestion::create(['service_request_id' => $request->id, 'provider_id' => $bidder->id, 'question' => 'Bidder asks?']);
        RequestQuestion::create(['service_request_id' => $request->id, 'provider_id' => $lurker->id, 'question' => 'Lurker asks?']);

        Sanctum::actingAs($client, ['client']);

        // Before any bid: no questions are visible.
        $this->getJson("/api/customer/v1/requests/{$request->id}/questions")
            ->assertOk()->assertJsonCount(0, 'data');

        // The bidder publishes a proposal → only their question becomes visible.
        $this->bid($request, $bidder);

        $this->getJson("/api/customer/v1/requests/{$request->id}/questions")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.question', 'Bidder asks?');
    }

    public function test_client_cannot_answer_a_question_before_the_provider_bids(): void
    {
        Notification::fake();
        [$request, $client, $provider] = $this->makeOpenRequest();
        $question = RequestQuestion::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id, 'question' => 'Before bid?',
        ]);

        Sanctum::actingAs($client, ['client']);

        // No proposal yet → answering is rejected.
        $this->postJson("/api/customer/v1/questions/{$question->id}/answer", ['answer' => 'Nope'])
            ->assertStatus(422);
        $this->assertDatabaseHas('request_questions', ['id' => $question->id, 'answer' => null]);

        // Once the provider bids, the same answer succeeds.
        $this->bid($request, $provider);

        $this->postJson("/api/customer/v1/questions/{$question->id}/answer", ['answer' => 'Yes'])
            ->assertOk()->assertJsonPath('answer', 'Yes');
    }
}
