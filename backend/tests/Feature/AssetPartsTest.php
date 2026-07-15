<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
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
}
