<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetPart;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssetPartsTest extends TestCase
{
    use RefreshDatabase;

    private function property(User $user): Asset
    {
        $detail = AssetProperty::create([]);

        return $user->assets()->create([
            'type' => 'property',
            'nickname' => 'Minha casa',
            'detailable_type' => 'property',
            'detailable_id' => $detail->id,
        ]);
    }

    /** An orphan upload owned by $user — what POST /uploads leaves behind. */
    private function orphanMedia(User $user): Media
    {
        return Media::create([
            'uploaded_by_id' => $user->id, 'disk' => 'public', 'path' => "uploads/{$user->id}/m.png",
        ]);
    }

    public function test_add_list_and_measure_parts(): void
    {
        $user = User::factory()->create();
        $asset = $this->property($user);
        Sanctum::actingAs($user, ['client']);

        $part = $this->postJson("/api/customer/v1/assets/{$asset->id}/parts", ['name' => 'Sala'])
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'Sala')
            ->assertJsonPath('data.points_count', null)
            ->json('data.id');

        // Save an AR measurement for the part.
        $this->putJson("/api/customer/v1/assets/{$asset->id}/parts/{$part}", [
            'area' => 12.5, 'perimeter' => 14.2, 'points_count' => 4,
        ])->assertOk()
            ->assertJsonPath('data.area', 12.5)
            ->assertJsonPath('data.perimeter', 14.2)
            ->assertJsonPath('data.points_count', 4);

        $this->assertNotNull(Asset::find($asset->id)->parts()->first()->measured_at);

        $this->getJson("/api/customer/v1/assets/{$asset->id}/parts")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.area', 12.5);
    }

    public function test_add_many_parts_at_once_keeping_the_given_order(): void
    {
        $user = User::factory()->create();
        $asset = $this->property($user);
        Sanctum::actingAs($user, ['client']);

        // What the suggestion chips send: every ticked room in one request.
        $this->postJson("/api/customer/v1/assets/{$asset->id}/parts", [
            'names' => ['Sala', 'Cozinha', 'Piscina'],
        ])->assertStatus(201)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Sala')
            ->assertJsonPath('data.2.name', 'Piscina')
            // A part is an empty slot to measure — never a claim about the place.
            ->assertJsonPath('data.2.area', null)
            ->assertJsonPath('data.2.points_count', null);

        $this->assertSame(3, $asset->parts()->count());
    }

    public function test_a_rejected_batch_creates_nothing(): void
    {
        $user = User::factory()->create();
        $asset = $this->property($user);
        Sanctum::actingAs($user, ['client']);

        // One bad name fails the whole batch, so a retry can't duplicate the
        // good ones — the reason the batch exists at all.
        $this->postJson("/api/customer/v1/assets/{$asset->id}/parts", [
            'names' => ['Sala', str_repeat('x', 81)],
        ])->assertStatus(422);

        $this->assertSame(0, $asset->parts()->count());
    }

    public function test_rename_and_remove_part(): void
    {
        $user = User::factory()->create();
        $asset = $this->property($user);
        Sanctum::actingAs($user, ['client']);

        $part = $asset->parts()->create(['name' => 'Piscina']);

        $this->putJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}", ['name' => 'Piscina grande'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Piscina grande');

        $this->deleteJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}")
            ->assertOk()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseMissing('asset_parts', ['id' => $part->id]);
    }

    public function test_parts_only_for_properties(): void
    {
        $user = User::factory()->create();
        $detail = AssetVehicle::create([]);
        $vehicle = $user->assets()->create([
            'type' => 'vehicle', 'nickname' => 'Carro', 'detailable_type' => 'vehicle', 'detailable_id' => $detail->id,
        ]);
        Sanctum::actingAs($user, ['client']);

        $this->postJson("/api/customer/v1/assets/{$vehicle->id}/parts", ['name' => 'Sala'])
            ->assertStatus(422);
    }

    public function test_cannot_touch_another_users_parts(): void
    {
        $owner = User::factory()->create();
        $asset = $this->property($owner);
        $part = $asset->parts()->create(['name' => 'Sala']);

        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger, ['client']);

        $this->getJson("/api/customer/v1/assets/{$asset->id}/parts")->assertStatus(403);
        $this->postJson("/api/customer/v1/assets/{$asset->id}/parts", ['name' => 'X'])->assertStatus(403);
        $this->deleteJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}")->assertStatus(403);
    }

    public function test_part_must_belong_to_asset(): void
    {
        $user = User::factory()->create();
        $a = $this->property($user);
        $b = $this->property($user);
        $partOfB = $b->parts()->create(['name' => 'Quarto']);
        Sanctum::actingAs($user, ['client']);

        // A part from asset B addressed under asset A must 404.
        $this->putJson("/api/customer/v1/assets/{$a->id}/parts/{$partOfB->id}", ['name' => 'x'])
            ->assertStatus(404);
    }

    public function test_saving_a_measurement_attaches_the_uploaded_photos(): void
    {
        $user = User::factory()->create();
        $asset = $this->property($user);
        $part = $asset->parts()->create(['name' => 'Sala']);
        $media = $this->orphanMedia($user);
        Sanctum::actingAs($user, ['client']);

        // Upload-first: the device uploads while measuring, then saves the
        // measurement and the photo ids together.
        $this->putJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}", [
            'area' => 12.5, 'perimeter' => 14.2, 'points_count' => 4,
            'media_ids' => [$media->id],
        ])->assertOk()
            ->assertJsonPath('data.points_count', 4)
            ->assertJsonCount(1, 'data.measurement_photos')
            ->assertJsonPath('data.measurement_photos.0.id', $media->id)
            ->assertJsonPath('data.measurement_photos.0.tag', 'measurement');

        $this->assertDatabaseHas('media', [
            'id' => $media->id,
            'mediable_type' => AssetPart::class,
            'mediable_id' => $part->id,
            'tag' => 'measurement',
        ]);

        // And it comes back on the list endpoint too.
        $this->getJson("/api/customer/v1/assets/{$asset->id}/parts")
            ->assertOk()
            ->assertJsonCount(1, 'data.0.measurement_photos');
    }

    public function test_cannot_attach_another_users_upload_to_own_part(): void
    {
        $stranger = User::factory()->create();
        $strangersMedia = $this->orphanMedia($stranger);

        $user = User::factory()->create();
        $asset = $this->property($user);
        $part = $asset->parts()->create(['name' => 'Sala']);
        Sanctum::actingAs($user, ['client']);

        // Guessing someone else's upload id must not hand you their photo.
        $this->putJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}", [
            'points_count' => 4, 'media_ids' => [$strangersMedia->id],
        ])->assertOk()
            ->assertJsonCount(0, 'data.measurement_photos');

        $this->assertDatabaseHas('media', ['id' => $strangersMedia->id, 'mediable_id' => null]);
    }

    public function test_cannot_attach_media_to_another_users_part(): void
    {
        $owner = User::factory()->create();
        $asset = $this->property($owner);
        $part = $asset->parts()->create(['name' => 'Sala']);

        $stranger = User::factory()->create();
        $media = $this->orphanMedia($stranger);
        Sanctum::actingAs($stranger, ['client']);

        // Own upload, someone else's part — the asset check rejects it first.
        $this->putJson("/api/customer/v1/assets/{$asset->id}/parts/{$part->id}", [
            'points_count' => 4, 'media_ids' => [$media->id],
        ])->assertStatus(403);

        $this->assertDatabaseHas('media', ['id' => $media->id, 'mediable_id' => null]);
        $this->assertSame(0, $part->measurementPhotos()->count());
    }
}
