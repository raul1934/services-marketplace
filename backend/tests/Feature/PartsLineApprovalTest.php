<?php

namespace Tests\Feature;

use App\Enums\PartAction;
use App\Enums\RequestStatus;
use App\Models\JobPart;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PartsLineApprovalTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: JobPart, 2: JobPart} */
    private function inProgressJobWithParts(): array
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
            'status' => RequestStatus::InProgress->value,
            'accepted_provider_id' => $provider->id,
            'parts_approval_requested_at' => now(),
        ]);
        $partA = JobPart::create([
            'service_request_id' => $request->id, 'name' => 'Filtro', 'action' => PartAction::Replaced->value,
            'quantity' => 1, 'unit_price' => 50,
        ]);
        $partB = JobPart::create([
            'service_request_id' => $request->id, 'name' => 'Óleo', 'action' => PartAction::Replaced->value,
            'quantity' => 1, 'unit_price' => 30,
        ]);

        return [$request, $partA, $partB];
    }

    public function test_client_can_approve_a_single_part(): void
    {
        [$request, $partA, $partB] = $this->inProgressJobWithParts();
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/parts/{$partA->id}/approve")->assertOk();

        $this->assertNotNull($partA->fresh()->approved_at);
        $this->assertNull($partB->fresh()->approved_at);
    }

    public function test_approving_is_idempotent(): void
    {
        [$request, $partA] = $this->inProgressJobWithParts();
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/parts/{$partA->id}/approve")->assertOk();
        $first = $partA->fresh()->approved_at;
        $this->postJson("/api/customer/v1/parts/{$partA->id}/approve")->assertOk();

        $this->assertEquals($first, $partA->fresh()->approved_at);
    }

    public function test_approve_all_still_works_and_backfills_remaining_lines(): void
    {
        [$request, $partA, $partB] = $this->inProgressJobWithParts();
        Sanctum::actingAs($request->client, ['client']);
        $this->postJson("/api/customer/v1/parts/{$partA->id}/approve")->assertOk();

        $this->postJson("/api/customer/v1/requests/{$request->id}/approve-parts")->assertOk();

        $this->assertNotNull($partA->fresh()->approved_at);
        $this->assertNotNull($partB->fresh()->approved_at);
        $this->assertNotNull($request->fresh()->parts_approved_at);
    }

    public function test_only_the_owning_client_can_approve(): void
    {
        [, $partA] = $this->inProgressJobWithParts();
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger, ['client']);

        $this->postJson("/api/customer/v1/parts/{$partA->id}/approve")->assertForbidden();
    }
}
