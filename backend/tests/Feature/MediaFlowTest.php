<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Media;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\MediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaFlowTest extends TestCase
{
    use RefreshDatabase;

    private function category(): ServiceCategory
    {
        return ServiceCategory::create([
            'type' => 'roadside', 'slug' => 'cat-'.uniqid(), 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true,
        ]);
    }

    /** A real 8×8 PNG (no GD needed) so the `image` rule passes. */
    private function pngFile(string $name = 'p.png'): UploadedFile
    {
        $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $size = 8;
        $ihdr = pack('N', $size).pack('N', $size)."\x08\x02\x00\x00\x00";
        $raw = str_repeat("\x00".str_repeat("\x33\x66\x99", $size), $size);
        $png = "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', gzcompress($raw, 9)).$chunk('IEND', '');

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    private function request(User $client): ServiceRequest
    {
        return ServiceRequest::create([
            'client_id' => $client->id,
            'service_category_id' => $this->category()->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Open->value,
        ]);
    }

    public function test_upload_creates_orphan_then_attaches_to_owner(): void
    {
        Storage::fake('public');
        $client = User::factory()->create(['is_client' => true]);
        Sanctum::actingAs($client, ['client']);

        // Upload-first: HTTP endpoint creates an orphan media.
        $id = $this->post('/api/customer/v1/uploads', [
            'photos' => [$this->pngFile()],
        ], ['Accept' => 'application/json'])->assertOk()->json('data.0.id');

        $this->assertDatabaseHas('media', ['id' => $id, 'mediable_id' => null, 'uploaded_by_id' => $client->id]);

        // Attach re-parents the orphan onto the request as a `request` photo.
        $request = $this->request($client);
        (new MediaService)->attach([$id], $request, 'request', $client->id);

        $media = Media::find($id);
        $this->assertSame(ServiceRequest::class, $media->mediable_type);
        $this->assertSame($request->id, $media->mediable_id);
        $this->assertSame('request', $media->tag);
        $this->assertCount(1, $request->photos);
    }

    public function test_cannot_attach_another_users_upload(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create(['is_client' => true]);
        Sanctum::actingAs($owner, ['client']);
        $id = $this->post('/api/customer/v1/uploads', [
            'photos' => [$this->pngFile()],
        ], ['Accept' => 'application/json'])->json('data.0.id');

        // A different user tries to attach the owner's orphan upload — ignored.
        $attacker = User::factory()->create(['is_client' => true]);
        (new MediaService)->attach([$id], $this->request($attacker), 'request', $attacker->id);

        $this->assertDatabaseHas('media', ['id' => $id, 'mediable_id' => null]);
    }

    public function test_prune_removes_old_orphans_only(): void
    {
        Storage::fake('public');
        $client = User::factory()->create();

        $oldOrphan = Media::create(['uploaded_by_id' => $client->id, 'disk' => 'public', 'path' => 'a.png']);
        DB::table('media')->where('id', $oldOrphan->id)->update(['created_at' => now()->subDays(2)]);
        $freshOrphan = Media::create(['uploaded_by_id' => $client->id, 'disk' => 'public', 'path' => 'b.png']);
        $attached = Media::create([
            'mediable_type' => ServiceRequest::class, 'mediable_id' => 1,
            'uploaded_by_id' => $client->id, 'disk' => 'public', 'path' => 'c.png',
        ]);
        DB::table('media')->where('id', $attached->id)->update(['created_at' => now()->subDays(2)]);

        $this->artisan('media:prune-orphans')->assertSuccessful();

        $this->assertDatabaseMissing('media', ['id' => $oldOrphan->id]);
        $this->assertDatabaseHas('media', ['id' => $freshOrphan->id]);
        $this->assertDatabaseHas('media', ['id' => $attached->id]);
    }
}
