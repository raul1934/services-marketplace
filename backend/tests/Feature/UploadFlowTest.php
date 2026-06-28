<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Asset;
use App\Models\AssetVehicle;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Upload-first model: one `POST uploads` endpoint, attach by media id. */
class UploadFlowTest extends TestCase
{
    use RefreshDatabase;

    /** A real 8×8 PNG so the `image` rule passes. */
    private function pngFile(string $name = 'p.png'): UploadedFile
    {
        $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $ihdr = pack('N', 8).pack('N', 8)."\x08\x02\x00\x00\x00";
        $raw = str_repeat("\x00".str_repeat("\x33\x66\x99", 8), 8);
        $png = "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', gzcompress($raw, 9)).$chunk('IEND', '');

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    private function upload(): int
    {
        return $this->post('/api/customer/v1/uploads', ['photos' => [$this->pngFile()]], ['Accept' => 'application/json'])
            ->assertOk()->json('data.0.id');
    }

    public function test_asset_photo_set_via_media_id(): void
    {
        Storage::fake('public');
        $client = User::factory()->create();
        Sanctum::actingAs($client, ['client']);

        $mediaId = $this->upload();
        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'pet', 'nickname' => 'Rex', 'photo_media_id' => $mediaId,
        ])->assertStatus(201);

        $this->assertNotNull($res->json('data.photo_url'));
        // The media is consumed onto the asset's own column (no orphan left).
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }

    public function test_non_owner_media_id_is_ignored(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        Sanctum::actingAs($owner, ['client']);
        $mediaId = $this->upload();

        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger, ['client']);
        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'pet', 'nickname' => 'NotMine', 'photo_media_id' => $mediaId,
        ])->assertStatus(201);

        $this->assertNull($res->json('data.photo_url')); // someone else's upload not applied
    }

    public function test_provider_attaches_before_photos_by_media_id(): void
    {
        Storage::fake('public');
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $category = ServiceCategory::create(['type' => 'roadside', 'slug' => 'c', 'name' => 'C', 'sort_order' => 1, 'is_active' => true]);
        $request = ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);

        Sanctum::actingAs($provider, ['provider']);
        $mediaId = $this->post('/api/provider/v1/uploads', ['photos' => [$this->pngFile()]], ['Accept' => 'application/json'])
            ->assertOk()->json('data.0.id');

        $this->postJson("/api/provider/v1/requests/{$request->id}/job-media", [
            'phase' => 'before', 'media_ids' => [$mediaId],
        ])->assertOk()->assertJsonCount(1, 'data.before_photos');

        $this->assertDatabaseHas('media', ['id' => $mediaId, 'mediable_id' => $request->id, 'tag' => 'before']);
    }
}
