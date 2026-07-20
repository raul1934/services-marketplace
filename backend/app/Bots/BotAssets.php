<?php

namespace App\Bots;

use App\Enums\AssetType;
use App\Models\Asset;
use App\Models\AssetPet;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use App\Models\PetBreed;
use App\Models\PetSpecies;
use App\Models\PropertyType;
use App\Models\User;
use App\Models\VehicleMake;
use App\Models\VehicleModel;

/**
 * TEMPORARY — test bots. Gives each bot client one asset of every type.
 *
 * Without this a bot request has no asset_id, and the "qual bem" card on the
 * request screen renders nothing — the screen looks broken when it is really
 * just missing data. Mirrors AssetSeeder's idiom (firstOrCreate on the catalog
 * rows) so it never depends on catalog coverage.
 */
class BotAssets
{
    /** Idempotent: nicknames are the natural key, so re-running adds nothing. */
    public static function seedFor(User $client): void
    {
        self::vehicle($client);
        self::property($client);
        self::pet($client);
    }

    /**
     * An asset of this client's that suits the category type, or null when the
     * category doesn't operate on an asset at all (beauty works on a person).
     */
    public static function pickFor(User $client, string $categoryType): ?Asset
    {
        $type = AssetType::forCategoryType($categoryType);

        if (! $type) {
            return null;
        }

        return $client->assets()
            ->active()
            ->where('type', $type->value)
            ->inRandomOrder()
            ->first();
    }

    private static function vehicle(User $client): void
    {
        $nickname = BotGate::label('Carro');

        if ($client->assets()->where('nickname', $nickname)->exists()) {
            return;
        }

        $make = VehicleMake::firstOrCreate(['name' => 'Fiat']);
        $model = VehicleModel::firstOrCreate(['vehicle_make_id' => $make->id, 'name' => 'Uno']);

        $detail = AssetVehicle::create([
            'vehicle_make_id' => $make->id,
            'vehicle_model_id' => $model->id,
            'plate' => 'TST'.random_int(1000, 9999),
            'color' => 'Branco',
            'year' => '2020',
        ]);

        $client->assets()->create([
            'type' => AssetType::Vehicle->value,
            'nickname' => $nickname,
            'detailable_type' => 'vehicle',
            'detailable_id' => $detail->id,
        ]);
    }

    private static function property(User $client): void
    {
        $nickname = BotGate::label('Imóvel');

        if ($client->assets()->where('nickname', $nickname)->exists()) {
            return;
        }

        $type = PropertyType::firstOrCreate(['name' => 'Apartamento']);

        $detail = AssetProperty::create([
            'property_type_id' => $type->id,
            'unit' => 'Apto 101',
            'size' => '60 m²',
            'address' => 'Endereço de teste, 100',
        ]);

        $client->assets()->create([
            'type' => AssetType::Property->value,
            'nickname' => $nickname,
            'detailable_type' => 'property',
            'detailable_id' => $detail->id,
        ]);
    }

    private static function pet(User $client): void
    {
        $nickname = BotGate::label('Pet');

        if ($client->assets()->where('nickname', $nickname)->exists()) {
            return;
        }

        $species = PetSpecies::firstOrCreate(['name' => 'Cão']);
        $breed = PetBreed::firstOrCreate(['pet_species_id' => $species->id, 'name' => 'SRD']);

        $detail = AssetPet::create([
            'pet_species_id' => $species->id,
            'pet_breed_id' => $breed->id,
            'size' => 'Médio',
            'weight' => '12 kg',
        ]);

        $client->assets()->create([
            'type' => AssetType::Pet->value,
            'nickname' => $nickname,
            'detailable_type' => 'pet',
            'detailable_id' => $detail->id,
        ]);
    }
}
