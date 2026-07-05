<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewSubmissionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User, 2: User} client, provider */
    private function completedJob(): array
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        ProviderProfile::create(['user_id' => $provider->id]);
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
            'accepted_provider_id' => $provider->id,
        ]);

        return [$request, $client, $provider];
    }

    public function test_customer_review_with_tip_credits_the_provider_wallet(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->completedJob();
        Sanctum::actingAs($request->client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/review", [
            'rating' => 5, 'tip_amount' => 15,
        ])->assertCreated();

        $this->assertSame(15.0, WalletTransaction::balanceFor($provider->id));
        $this->assertSame(5.0, (float) $provider->providerProfile->fresh()->rating_avg);
    }

    public function test_customer_cannot_review_twice(): void
    {
        Notification::fake();
        [$request] = $this->completedJob();
        Sanctum::actingAs($request->client, ['client']);
        $this->postJson("/api/customer/v1/requests/{$request->id}/review", ['rating' => 5]);

        $this->postJson("/api/customer/v1/requests/{$request->id}/review", ['rating' => 3])
            ->assertStatus(422);
    }

    public function test_provider_review_updates_client_rating_and_preferred_pivot(): void
    {
        Notification::fake();
        [$request, $client, $provider] = $this->completedJob();
        Sanctum::actingAs($provider, ['provider']);

        $this->postJson("/api/provider/v1/requests/{$request->id}/client-review", [
            'rating' => 4, 'preferred' => true,
        ])->assertCreated();

        $this->assertSame(4.0, (float) $client->fresh()->rating_avg);
        $this->assertTrue($provider->preferredClients()->where('client_id', $client->id)->exists());
    }

    public function test_provider_cannot_review_the_same_client_twice(): void
    {
        Notification::fake();
        [$request, , $provider] = $this->completedJob();
        Sanctum::actingAs($provider, ['provider']);
        $this->postJson("/api/provider/v1/requests/{$request->id}/client-review", ['rating' => 4]);

        $this->postJson("/api/provider/v1/requests/{$request->id}/client-review", ['rating' => 2])
            ->assertStatus(422);
    }
}
