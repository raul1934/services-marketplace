<?php

namespace Tests\Feature;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Events\RequestStatusUpdated;
use App\Http\Resources\ServiceRequestResource;
use App\Models\JobPart;
use App\Models\Proposal;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StartCodeAndReceiptTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User} */
    private function makeAcceptedJob(string $code = '1234', float $price = 100): array
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
            'status' => RequestStatus::Accepted->value,
            'accepted_provider_id' => $provider->id,
            'start_code' => $code,
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

    public function test_wrong_start_code_is_rejected_and_status_unchanged(): void
    {
        Event::fake([RequestStatusUpdated::class]);
        Notification::fake();
        [$request, , $provider] = $this->makeAcceptedJob('1234');
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/start", ['code' => '0000'])
            ->assertStatus(422);

        $this->assertSame(RequestStatus::Accepted, $request->fresh()->status);
        Event::assertNotDispatched(RequestStatusUpdated::class);
    }

    public function test_correct_start_code_starts_the_job(): void
    {
        Event::fake([RequestStatusUpdated::class]);
        Notification::fake();
        [$request, , $provider] = $this->makeAcceptedJob('1234');
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/start", ['code' => '1234'])
            ->assertOk();

        $fresh = $request->fresh();
        $this->assertSame(RequestStatus::InProgress, $fresh->status);
        $this->assertNotNull($fresh->started_at);
        Event::assertDispatched(RequestStatusUpdated::class);
    }

    public function test_provider_payload_never_exposes_start_code(): void
    {
        [$request, , $provider] = $this->makeAcceptedJob('1234');
        Sanctum::actingAs($provider, ['provider']);

        $this->getJson("/api/provider/v1/provider/requests/{$request->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.start_code');
    }

    public function test_settlement_breakdown_sums_labor_parts_and_surcharges(): void
    {
        [$request, $client, $provider] = $this->makeAcceptedJob('1234', 100);
        $request->update(['status' => RequestStatus::Completed->value, 'completed_at' => now()]);
        JobPart::create([
            'service_request_id' => $request->id, 'name' => 'pad', 'action' => 'added',
            'quantity' => 2, 'unit_price' => 20,
        ]);
        Surcharge::create([
            'service_request_id' => $request->id, 'provider_id' => $provider->id,
            'amount' => 10, 'reason' => 'x', 'percent_accumulated' => 10,
            'tier' => SurchargeTier::Simple->value, 'status' => SurchargeStatus::Approved->value,
        ]);

        $request->load(['acceptedProposal', 'jobParts', 'surcharges']);
        $req = Request::create('/');
        $req->setUserResolver(fn () => $client);
        $arr = (new ServiceRequestResource($request))->resolve($req);

        $this->assertSame(100.0, $arr['settlement']['labor']);
        $this->assertSame(40.0, $arr['settlement']['parts_total']);
        $this->assertSame(10.0, $arr['settlement']['surcharges_total']);
        $this->assertSame(150.0, $arr['settlement']['total']);
        $this->assertStringStartsWith('WV-', $arr['settlement']['receipt_no']);
    }
}
