<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * `GET /customer/v1/requests?status=` — the status filter has to run in SQL:
 * the list is paginated, so filtering the loaded pages in the app would both
 * hide results and under-report the count shown to the client.
 */
class CustomerRequestListFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $client;

    private ServiceCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = User::factory()->create();
        $this->category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-filter', 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
    }

    private function makeRequests(RequestStatus $status, int $count = 1): void
    {
        for ($i = 0; $i < $count; $i++) {
            ServiceRequest::create([
                'client_id' => $this->client->id,
                'service_category_id' => $this->category->id,
                'description' => 'test', 'latitude' => 0, 'longitude' => 0,
                'status' => $status->value,
            ]);
        }
    }

    public function test_filters_by_status_bucket(): void
    {
        $this->makeRequests(RequestStatus::Open, 2);
        $this->makeRequests(RequestStatus::Completed, 3);
        $this->makeRequests(RequestStatus::Cancelled);
        Sanctum::actingAs($this->client, ['client']);

        $this->getJson('/api/customer/v1/requests')->assertOk()->assertJsonCount(6, 'data');

        $res = $this->getJson('/api/customer/v1/requests?status=completed')->assertOk();
        $res->assertJsonCount(3, 'data');
        $this->assertSame(
            [RequestStatus::Completed->value],
            array_values(array_unique(array_column($res->json('data'), 'status'))),
        );
    }

    /** The buckets group several statuses; `active` and `cancelled` are the ones that do. */
    public function test_buckets_cover_every_status_they_group(): void
    {
        $this->makeRequests(RequestStatus::Accepted);
        $this->makeRequests(RequestStatus::InProgress);
        $this->makeRequests(RequestStatus::Requote);
        $this->makeRequests(RequestStatus::Cancelled);
        $this->makeRequests(RequestStatus::Expired);
        $this->makeRequests(RequestStatus::Open);
        Sanctum::actingAs($this->client, ['client']);

        $this->getJson('/api/customer/v1/requests?status=active')->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/customer/v1/requests?status=cancelled')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/customer/v1/requests?status=open')->assertOk()->assertJsonCount(1, 'data');
    }

    /**
     * The point of the whole change: `meta.total` counts the filtered set on the
     * server, so the "N results" line is right even on page one of many.
     */
    public function test_total_counts_the_whole_filtered_set_not_just_the_page(): void
    {
        $this->makeRequests(RequestStatus::Completed, 25);
        $this->makeRequests(RequestStatus::Open, 15);
        Sanctum::actingAs($this->client, ['client']);

        $res = $this->getJson('/api/customer/v1/requests?status=completed&per_page=20')->assertOk();

        $res->assertJsonCount(20, 'data');
        $res->assertJsonPath('meta.total', 25);
        $res->assertJsonPath('meta.last_page', 2);

        $page2 = $this->getJson('/api/customer/v1/requests?status=completed&per_page=20&page=2')->assertOk();
        $page2->assertJsonCount(5, 'data');
        $page2->assertJsonPath('meta.total', 25);
    }

    public function test_rejects_an_unknown_bucket(): void
    {
        Sanctum::actingAs($this->client, ['client']);

        $this->getJson('/api/customer/v1/requests?status=in_progress')
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_never_leaks_another_clients_requests(): void
    {
        $this->makeRequests(RequestStatus::Completed);
        $stranger = User::factory()->create();
        ServiceRequest::create([
            'client_id' => $stranger->id,
            'service_category_id' => $this->category->id,
            'description' => 'other', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
        ]);
        Sanctum::actingAs($this->client, ['client']);

        $this->getJson('/api/customer/v1/requests?status=completed')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1);
    }
}
