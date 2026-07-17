<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Asset;
use App\Models\AssetReading;
use App\Models\AssetVehicle;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\VehicleMake;
use App\Models\VehicleModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssetEnrichmentTest extends TestCase
{
    use RefreshDatabase;

    private function makeCatalog(): array
    {
        $honda = VehicleMake::create(['name' => 'Honda']);
        $civic = VehicleModel::create(['vehicle_make_id' => $honda->id, 'name' => 'Civic']);
        $toyota = VehicleMake::create(['name' => 'Toyota']);

        return [$honda, $civic, $toyota];
    }

    private function makeVehicleAsset(User $client): Asset
    {
        [$honda, $civic] = $this->makeCatalog();
        $detail = AssetVehicle::create([
            'vehicle_make_id' => $honda->id, 'vehicle_model_id' => $civic->id, 'plate' => 'ABC1D23',
        ]);

        return $client->assets()->create([
            'type' => 'vehicle', 'nickname' => 'Car', 'detailable_type' => 'vehicle', 'detailable_id' => $detail->id,
        ]);
    }

    public function test_create_vehicle_asset_persists_typed_detail_and_initial_reading(): void
    {
        $client = User::factory()->create();
        [$honda, $civic] = $this->makeCatalog();
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'vehicle',
            'nickname' => 'Civic do pai',
            'detail' => [
                'vehicle_make_id' => $honda->id, 'vehicle_model_id' => $civic->id,
                'plate' => 'ABC1D23', 'color' => 'Prata', 'year' => '2019', 'mileage' => 50000,
            ],
        ])->assertStatus(201);

        $res->assertJsonPath('data.type', 'vehicle')
            ->assertJsonPath('data.detail.make', 'Honda')
            ->assertJsonPath('data.detail.model', 'Civic')
            ->assertJsonPath('data.detail.plate', 'ABC1D23')
            ->assertJsonPath('data.detail.current_mileage', 50000);

        $id = $res->json('data.id');
        $this->assertDatabaseHas('asset_vehicles', ['plate' => 'ABC1D23', 'color' => 'Prata']);
        $this->assertDatabaseHas('asset_readings', ['asset_id' => $id, 'mileage' => 50000, 'source' => 'customer']);
    }

    public function test_model_must_belong_to_make(): void
    {
        $client = User::factory()->create();
        [$honda, $civic, $toyota] = $this->makeCatalog();
        Sanctum::actingAs($client, ['client']);

        $this->postJson('/api/customer/v1/assets', [
            'type' => 'vehicle', 'nickname' => 'X',
            'detail' => ['vehicle_make_id' => $toyota->id, 'vehicle_model_id' => $civic->id],
        ])->assertStatus(422);
    }

    public function test_customer_reading_appends_and_bumps_without_lowering(): void
    {
        $client = User::factory()->create();
        $asset = $this->makeVehicleAsset($client);
        Sanctum::actingAs($client, ['client']);

        $this->postJson("/api/customer/v1/assets/{$asset->id}/readings", ['mileage' => 52000])
            ->assertStatus(201)->assertJsonPath('current_mileage', 52000)->assertJsonPath('data.source', 'customer');

        // A lower reading is logged but does not lower the current.
        $this->postJson("/api/customer/v1/assets/{$asset->id}/readings", ['mileage' => 51000])
            ->assertStatus(201)->assertJsonPath('current_mileage', 52000);

        $this->assertEquals(2, AssetReading::where('asset_id', $asset->id)->count());
        $this->assertEquals(52000, $asset->refresh()->detailable->current_mileage);
    }

    public function test_provider_records_odometer_on_their_job(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $asset = $this->makeVehicleAsset($client);
        $category = ServiceCategory::create(['type' => 'roadside', 'slug' => 'c1', 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true]);
        $request = ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id, 'asset_id' => $asset->id,
            'description' => 'oil change', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);

        Sanctum::actingAs($provider, ['provider']);
        $this->postJson("/api/provider/v1/requests/{$request->id}/odometer", ['mileage' => 60000, 'note' => 'Troca de óleo'])
            ->assertStatus(201)->assertJsonPath('data.source', 'provider')->assertJsonPath('current_mileage', 60000);

        $this->assertDatabaseHas('asset_readings', [
            'asset_id' => $asset->id, 'service_request_id' => $request->id, 'source' => 'provider', 'mileage' => 60000,
        ]);

        // It surfaces in the owner's reading history.
        Sanctum::actingAs($client, ['client']);
        $this->getJson("/api/customer/v1/assets/{$asset->id}/readings")
            ->assertOk()->assertJsonFragment(['mileage' => 60000, 'source' => 'provider']);
    }

    public function test_non_accepted_provider_cannot_record_and_non_vehicle_is_rejected(): void
    {
        $client = User::factory()->create();
        $provider = User::factory()->create();
        $stranger = User::factory()->create();
        $asset = $this->makeVehicleAsset($client);
        $category = ServiceCategory::create(['type' => 'roadside', 'slug' => 'c2', 'name' => 'Cat', 'sort_order' => 1, 'is_active' => true]);
        $request = ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id, 'asset_id' => $asset->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);

        Sanctum::actingAs($stranger, ['provider']);
        $this->postJson("/api/provider/v1/requests/{$request->id}/odometer", ['mileage' => 1])->assertStatus(403);

        // Request with no vehicle asset → 422.
        $noAsset = ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id,
            'description' => 'x', 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::InProgress->value, 'accepted_provider_id' => $provider->id,
        ]);
        Sanctum::actingAs($provider, ['provider']);
        $this->postJson("/api/provider/v1/requests/{$noAsset->id}/odometer", ['mileage' => 1])->assertStatus(422);
    }

    public function test_history_lists_the_assets_requests_newest_first(): void
    {
        $client = User::factory()->create();
        $asset = $this->makeVehicleAsset($client);
        // A second asset of the same owner: history must not bleed between them.
        $other = $client->assets()->create(['type' => 'property', 'nickname' => 'Casa']);
        $category = ServiceCategory::create(['type' => 'roadside', 'slug' => 'tow', 'name' => 'Guincho', 'sort_order' => 1, 'is_active' => true]);

        $make = fn (Asset $on, string $description) => ServiceRequest::create([
            'client_id' => $client->id, 'service_category_id' => $category->id, 'asset_id' => $on->id,
            'description' => $description, 'latitude' => 0, 'longitude' => 0,
            'status' => RequestStatus::Completed->value,
        ]);
        $make($asset, 'primeiro');
        $make($asset, 'segundo');
        $make($other, 'de outro carro');

        Sanctum::actingAs($client, ['client']);
        $this->getJson("/api/customer/v1/assets/{$asset->id}/history")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.description', 'segundo')
            ->assertJsonPath('data.1.description', 'primeiro');
    }

    public function test_history_is_owner_only(): void
    {
        $client = User::factory()->create();
        $stranger = User::factory()->create();
        $asset = $this->makeVehicleAsset($client);

        Sanctum::actingAs($stranger, ['client']);
        $this->getJson("/api/customer/v1/assets/{$asset->id}/history")->assertStatus(403);
    }

    public function test_vehicle_makes_catalog_lists_makes_with_models(): void
    {
        $client = User::factory()->create();
        $this->makeCatalog();
        Sanctum::actingAs($client, ['client']);

        $this->getJson('/api/customer/v1/vehicle-makes')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Honda'])
            ->assertJsonFragment(['name' => 'Civic']);
    }
}
