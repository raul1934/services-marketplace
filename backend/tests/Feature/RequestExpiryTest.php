<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\RequestExpired;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RequestExpiryTest extends TestCase
{
    use RefreshDatabase;

    private function makeRequest(array $overrides = []): ServiceRequest
    {
        $client = User::factory()->create();
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);

        $request = ServiceRequest::create(array_merge([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'test', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
            'urgency' => RequestUrgency::Urgent->value,
            'max_wait_minutes' => 10,
        ], $overrides));

        // created_at isn't mass-assignable via create() timestamps — set it directly.
        if (isset($overrides['created_at'])) {
            $request->created_at = $overrides['created_at'];
            $request->save();
        }

        return $request;
    }

    public function test_expires_urgent_requests_past_their_max_wait(): void
    {
        Notification::fake();
        $stale = $this->makeRequest(['created_at' => now()->subMinutes(20)]);

        $this->artisan('requests:expire-stale')->assertSuccessful();

        $this->assertSame(RequestStatus::Expired, $stale->fresh()->status);
        Notification::assertSentTo($stale->client, RequestExpired::class);
    }

    public function test_leaves_fresh_requests_alone(): void
    {
        Notification::fake();
        $fresh = $this->makeRequest(['created_at' => now()->subMinutes(2)]);

        $this->artisan('requests:expire-stale');

        $this->assertSame(RequestStatus::Open, $fresh->fresh()->status);
    }

    public function test_ignores_scheduled_and_already_answered_requests(): void
    {
        Notification::fake();
        $scheduled = $this->makeRequest([
            'urgency' => RequestUrgency::Scheduled->value,
            'created_at' => now()->subMinutes(20),
        ]);
        $noWait = $this->makeRequest(['max_wait_minutes' => null, 'created_at' => now()->subMinutes(20)]);
        $accepted = $this->makeRequest(['status' => RequestStatus::Accepted->value, 'created_at' => now()->subMinutes(20)]);

        $this->artisan('requests:expire-stale');

        $this->assertSame(RequestStatus::Open, $scheduled->fresh()->status);
        $this->assertSame(RequestStatus::Open, $noWait->fresh()->status);
        $this->assertSame(RequestStatus::Accepted, $accepted->fresh()->status);
    }
}
