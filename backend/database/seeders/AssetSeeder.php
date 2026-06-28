<?php

namespace Database\Seeders;

use App\Enums\AssetType;
use App\Models\AssetPet;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use App\Models\PetBreed;
use App\Models\PetSpecies;
use App\Models\PropertyType;
use App\Models\User;
use App\Models\VehicleMake;
use App\Models\VehicleModel;
use App\Services\AssetReadingService;
use Illuminate\Database\Seeder;

/** A few assets (vehicles, a property, pets) for the dev client, so every asset
 *  type — and the asset selector on the request flow — has data out of the box.
 *  Dev/test only. The property's service history is seeded by AssetHistorySeeder. */
class AssetSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $client = User::where('email', 'cliente@walvee.test')->first();
        if (! $client) {
            return;
        }

        $this->seedVehicles($client);
        $this->seedProperty($client);
        $this->seedPets($client);
    }

    private function seedVehicles(User $client): void
    {
        $vehicles = [
            ['nickname' => 'Civic do pai', 'make' => 'Honda', 'model' => 'Civic', 'plate' => 'ABC1D23', 'color' => 'Prata', 'year' => '2019', 'km' => 48210],
            ['nickname' => 'Gol da firma', 'make' => 'Volkswagen', 'model' => 'Gol', 'plate' => 'DEF4G56', 'color' => 'Branco', 'year' => '2021', 'km' => 32000],
            ['nickname' => 'Minha moto', 'make' => 'Honda', 'model' => 'CG 160', 'plate' => 'GHI7J89', 'color' => 'Vermelha', 'year' => '2022', 'km' => 15500],
        ];

        $readings = app(AssetReadingService::class);

        foreach ($vehicles as $v) {
            if ($client->assets()->where('nickname', $v['nickname'])->exists()) {
                continue;
            }

            // Resolve catalog ids (firstOrCreate so dev data never depends on dataset coverage).
            $make = VehicleMake::firstOrCreate(['name' => $v['make']]);
            $model = VehicleModel::firstOrCreate(['vehicle_make_id' => $make->id, 'name' => $v['model']]);

            $detail = AssetVehicle::create([
                'vehicle_make_id' => $make->id,
                'vehicle_model_id' => $model->id,
                'plate' => $v['plate'],
                'color' => $v['color'],
                'year' => $v['year'],
            ]);

            $asset = $client->assets()->create([
                'type' => AssetType::Vehicle->value,
                'nickname' => $v['nickname'],
                'detailable_type' => 'vehicle',
                'detailable_id' => $detail->id,
            ]);

            $asset->setRelation('detailable', $detail);
            $readings->record($asset, ['mileage' => $v['km']], 'customer', $client->id);
        }
    }

    private function seedProperty(User $client): void
    {
        if ($client->assets()->where('nickname', 'Apê 502')->exists()) {
            return;
        }

        $type = PropertyType::firstOrCreate(['name' => 'Apartamento']);
        $detail = AssetProperty::create([
            'property_type_id' => $type->id,
            'unit' => 'Apto 502',
            'size' => '72 m²',
            'address' => 'Rua das Flores, 100',
            'floor' => '5º',
            'condo' => 'Ed. Primavera',
        ]);

        $client->assets()->create([
            'type' => AssetType::Property->value,
            'nickname' => 'Apê 502',
            'detailable_type' => 'property',
            'detailable_id' => $detail->id,
        ]);
    }

    private function seedPets(User $client): void
    {
        $pets = [
            ['nickname' => 'Rex', 'species' => 'Cão', 'breed' => 'Labrador', 'size' => 'Grande', 'weight' => '32 kg', 'birthdate' => '2020-05-10'],
            ['nickname' => 'Mimi', 'species' => 'Gato', 'breed' => 'Persa', 'size' => 'Pequeno', 'weight' => '4 kg', 'birthdate' => '2022-03-01'],
        ];

        foreach ($pets as $pt) {
            if ($client->assets()->where('nickname', $pt['nickname'])->exists()) {
                continue;
            }

            $species = PetSpecies::firstOrCreate(['name' => $pt['species']]);
            $breed = PetBreed::firstOrCreate(['pet_species_id' => $species->id, 'name' => $pt['breed']]);

            $detail = AssetPet::create([
                'pet_species_id' => $species->id,
                'pet_breed_id' => $breed->id,
                'size' => $pt['size'],
                'weight' => $pt['weight'],
                'birthdate' => $pt['birthdate'],
            ]);

            $client->assets()->create([
                'type' => AssetType::Pet->value,
                'nickname' => $pt['nickname'],
                'detailable_type' => 'pet',
                'detailable_id' => $detail->id,
            ]);
        }
    }
}
