<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\CustomerNoShowReported;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerNoShowTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User} */
    private function acceptedJob(RequestStatus $status = RequestStatus::Accepted): array
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
            'status' => $status->value,
            'accepted_provider_id' => $provider->id,
        ]);

        return [$request, $provider];
    }

    public function test_provider_can_report_customer_no_show(): void
    {
        Notification::fake();
        [$request, $provider] = $this->acceptedJob();
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/customer-no-show", ['reason' => 'Ninguém atendeu'])
            ->assertOk();

        $fresh = $request->fresh();
        $this->assertSame(RequestStatus::Cancelled, $fresh->status);
        $this->assertSame('customer_no_show', $fresh->cancelled_reason);
        $this->assertSame(1, $request->client->fresh()->no_show_count);
        Notification::assertSentTo($request->client, CustomerNoShowReported::class);
    }

    public function test_cannot_report_no_show_on_open_request(): void
    {
        [$request, $provider] = $this->acceptedJob(RequestStatus::Open);
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/customer-no-show")->assertStatus(422);
    }

    public function test_only_the_accepted_provider_can_report_it(): void
    {
        [$request] = $this->acceptedJob();
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/customer-no-show")->assertForbidden();
    }
}
