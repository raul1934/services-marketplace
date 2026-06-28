<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\YouWereRated;
use App\Services\ReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReviewNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_review_notifies_the_provider(): void
    {
        Notification::fake();

        $client = User::factory()->create();
        $provider = User::factory()->create();
        ProviderProfile::create([
            'user_id' => $provider->id, 'rating_avg' => 0, 'rating_count' => 0, 'jobs_completed' => 0,
        ]);
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-rev', 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'done',
            'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
            'accepted_provider_id' => $provider->id,
        ]);

        app(ReviewService::class)->create($request, 5, 'great');

        Notification::assertSentTo($provider, YouWereRated::class);
    }
}
