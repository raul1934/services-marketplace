<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\Question;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Filling in a request after it was sent.
 *
 * The express flow asks for the least it can — what happened, and where — so
 * everything else has to be addable afterwards, while providers are already
 * looking. The three things are not equivalent, and that asymmetry is what
 * these tests pin down: photos and answers only ever tell the provider more,
 * but a budget is what they bid *against*, so it freezes the moment a bid
 * exists. Otherwise the customer could move the goalposts after the kick.
 */
class RequestAddDetailsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: ServiceCategory} */
    private function makeOpenRequest(): array
    {
        $client = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'carro nao liga',
            'latitude' => 0, 'longitude' => 0,
            'budget_max' => 120,
            'status' => RequestStatus::Open->value,
        ]);

        return [$request->fresh(), $client, $category];
    }

    public function test_budget_can_be_changed_while_nobody_has_bid(): void
    {
        [$request, $client] = $this->makeOpenRequest();
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/details", ['budget_max' => 260])
            ->assertOk();

        $this->assertEquals(260, (float) $request->fresh()->budget_max);
    }

    public function test_budget_is_frozen_once_a_provider_has_bid(): void
    {
        [$request, $client] = $this->makeOpenRequest();
        $provider = User::factory()->create();
        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 200,
            'eta_minutes' => 20,
            'status' => ProposalStatus::Pending->value,
        ]);

        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/details", ['budget_max' => 999])
            ->assertStatus(422);

        // The point of the guard: the bid the provider made still stands
        // against the number they saw.
        $this->assertEquals(120, (float) $request->fresh()->budget_max);
    }

    public function test_answers_and_photos_are_still_allowed_after_a_bid(): void
    {
        [$request, $client, $category] = $this->makeOpenRequest();
        $provider = User::factory()->create();
        Proposal::create([
            'service_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 200,
            'eta_minutes' => 20,
            'status' => ProposalStatus::Pending->value,
        ]);
        $question = Question::create([
            'service_category_id' => $category->id, 'category_type' => 'roadside',
            'key' => 'where', 'text' => ['pt' => 'Onde esta?'], 'type' => 'text', 'sort_order' => 1,
        ]);

        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/details", [
            'answers' => [['question_id' => $question->id, 'answer' => 'na rodovia']],
        ])->assertOk();

        $this->assertSame('na rodovia', $request->fresh()->answers()->first()->answer);
    }

    public function test_answering_the_same_question_twice_replaces_it(): void
    {
        [$request, $client, $category] = $this->makeOpenRequest();
        $question = Question::create([
            'service_category_id' => $category->id, 'category_type' => 'roadside',
            'key' => 'where', 'text' => ['pt' => 'Onde esta?'], 'type' => 'text', 'sort_order' => 1,
        ]);

        Sanctum::actingAs($client, ['client']);

        foreach (['na rodovia', 'na verdade na garagem'] as $answer) {
            $this->postJson("/api/customer/v1/requests/{$request->id}/details", [
                'answers' => [['question_id' => $question->id, 'answer' => $answer]],
            ])->assertOk();
        }

        // Appending would leave the provider reading two contradictory answers
        // with nothing to say which one is current.
        $answers = $request->fresh()->answers()->get();
        $this->assertCount(1, $answers);
        $this->assertSame('na verdade na garagem', $answers->first()->answer);
    }

    public function test_a_request_that_is_no_longer_open_rejects_details(): void
    {
        [$request, $client] = $this->makeOpenRequest();
        $request->update(['status' => RequestStatus::Completed->value]);

        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/details", ['budget_max' => 260])
            ->assertStatus(422);
    }

    public function test_someone_else_cannot_add_details_to_your_request(): void
    {
        [$request] = $this->makeOpenRequest();
        Sanctum::actingAs(User::factory()->create(), ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/details", ['budget_max' => 260])
            ->assertStatus(403);
    }
}
