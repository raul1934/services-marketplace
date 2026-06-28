<?php

namespace Tests\Feature;

use App\Models\PetBreed;
use App\Models\PetSpecies;
use App\Models\PropertyType;
use App\Models\User;
use App\Models\VehicleMake;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssetCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_property_with_type_id_resolves_name(): void
    {
        $client = User::factory()->create();
        $type = PropertyType::create(['name' => 'Apartamento']);
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'property',
            'nickname' => 'Apê 502',
            'detail' => ['property_type_id' => $type->id, 'unit' => 'Apto 502'],
        ])->assertStatus(201);

        $res->assertJsonPath('data.detail.property_type_id', $type->id)
            ->assertJsonPath('data.detail.kind', 'Apartamento')
            ->assertJsonPath('data.detail.unit', 'Apto 502');
        $this->assertDatabaseHas('asset_properties', ['property_type_id' => $type->id, 'unit' => 'Apto 502']);
    }

    public function test_create_pet_with_species_and_breed_ids_resolves_names(): void
    {
        $client = User::factory()->create();
        $species = PetSpecies::create(['name' => 'Cão']);
        $breed = PetBreed::create(['pet_species_id' => $species->id, 'name' => 'Labrador']);
        Sanctum::actingAs($client, ['client']);

        $res = $this->postJson('/api/customer/v1/assets', [
            'type' => 'pet',
            'nickname' => 'Rex',
            'detail' => ['pet_species_id' => $species->id, 'pet_breed_id' => $breed->id, 'weight' => '30 kg'],
        ])->assertStatus(201);

        $res->assertJsonPath('data.detail.species', 'Cão')
            ->assertJsonPath('data.detail.breed', 'Labrador')
            ->assertJsonPath('data.detail.weight', '30 kg');
    }

    public function test_breed_must_belong_to_species(): void
    {
        $client = User::factory()->create();
        $dog = PetSpecies::create(['name' => 'Cão']);
        $cat = PetSpecies::create(['name' => 'Gato']);
        $dogBreed = PetBreed::create(['pet_species_id' => $dog->id, 'name' => 'Labrador']);
        Sanctum::actingAs($client, ['client']);

        $this->postJson('/api/customer/v1/assets', [
            'type' => 'pet', 'nickname' => 'X',
            'detail' => ['pet_species_id' => $cat->id, 'pet_breed_id' => $dogBreed->id],
        ])->assertStatus(422);
    }

    public function test_property_types_endpoint(): void
    {
        $client = User::factory()->create();
        PropertyType::create(['name' => 'Casa']);
        Sanctum::actingAs($client, ['client']);

        $this->getJson('/api/customer/v1/property-types')->assertOk()->assertJsonFragment(['name' => 'Casa']);
    }

    public function test_pet_species_endpoint_nests_breeds(): void
    {
        $client = User::factory()->create();
        $species = PetSpecies::create(['name' => 'Gato']);
        PetBreed::create(['pet_species_id' => $species->id, 'name' => 'Siamês']);
        Sanctum::actingAs($client, ['client']);

        $this->getJson('/api/customer/v1/pet-species')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Gato'])
            ->assertJsonFragment(['name' => 'Siamês']);
    }

    public function test_vehicle_makes_expose_logo_url(): void
    {
        $client = User::factory()->create();
        VehicleMake::create(['name' => 'Honda', 'logo_path' => 'https://cdn.example/honda.png']);
        Sanctum::actingAs($client, ['client']);

        $this->getJson('/api/customer/v1/vehicle-makes')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Honda', 'logo_url' => 'https://cdn.example/honda.png']);
    }
}
