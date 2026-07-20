<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Media;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Warranty claims carry photo evidence: ops triages them without having seen the
 * job, so the picture is usually the case.
 */
class WarrantyPhotosTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: ServiceRequest, 1: User} */
    private function completedJob(): array
    {
        $client = User::factory()->create(['is_client' => true]);
        $category = ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.$client->id, 'name' => 'Cat',
            'sort_order' => 1, 'is_active' => true,
        ]);

        $request = ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
            'completed_at' => now()->subDay(),
        ]);

        return [$request, $client];
    }

    private function uploadedMedia(User $owner): Media
    {
        return Media::create([
            'uploaded_by_id' => $owner->id,
            'disk' => 'public',
            'path' => 'warranty/evidence.jpg',
        ]);
    }

    public function test_a_claim_keeps_the_photos_the_client_attached(): void
    {
        Notification::fake();
        [$request, $client] = $this->completedJob();
        $media = $this->uploadedMedia($client);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/warranty", [
            'type' => 'redo',
            'description' => 'Voltou a falhar no dia seguinte.',
            'media_ids' => [$media->id],
        ])->assertCreated();

        $claim = $request->warrantyClaims()->firstOrFail();

        $this->assertSame(1, $claim->photos()->count());
        $this->assertSame('warranty', $media->fresh()->tag);
    }

    public function test_the_photos_come_back_when_listing_claims(): void
    {
        Notification::fake();
        [$request, $client] = $this->completedJob();
        $media = $this->uploadedMedia($client);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/warranty", [
            'type' => 'refund',
            'media_ids' => [$media->id],
        ])->assertCreated();

        $this->getJson("/api/customer/v1/requests/{$request->id}/warranty")
            ->assertOk()
            ->assertJsonCount(1, 'data.0.photos');
    }

    /**
     * MediaService::attach only claims rows the caller uploaded and that aren't
     * already owned — so passing someone else's id silently attaches nothing
     * rather than stealing their photo into your claim.
     */
    public function test_another_users_media_cannot_be_attached(): void
    {
        Notification::fake();
        [$request, $client] = $this->completedJob();
        $stranger = User::factory()->create();
        $theirs = $this->uploadedMedia($stranger);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/requests/{$request->id}/warranty", [
            'type' => 'redo',
            'media_ids' => [$theirs->id],
        ])->assertCreated();

        $this->assertSame(0, $request->warrantyClaims()->firstOrFail()->photos()->count());
        $this->assertNull($theirs->fresh()->mediable_id);
    }

    public function test_more_than_five_photos_is_rejected(): void
    {
        Notification::fake();
        [$request, $client] = $this->completedJob();
        Sanctum::actingAs($client, ['client']);

        $ids = collect(range(1, 6))->map(fn () => $this->uploadedMedia($client)->id)->all();

        $this->postJson("/api/customer/v1/requests/{$request->id}/warranty", [
            'type' => 'redo',
            'media_ids' => $ids,
        ])->assertStatus(422);
    }
}
