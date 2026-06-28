<?php

namespace Database\Seeders;

use App\Models\PetBreed;
use App\Models\PetSpecies;
use Illuminate\Database\Seeder;

/**
 * Seeds pet species + breeds from the vendored dataset
 * (`database/data/pet-breeds.json`, shaped `[{species, breeds:[]}]`). Idempotent.
 */
class PetCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/pet-breeds.json');
        if (! is_file($path)) {
            return;
        }

        foreach (json_decode(file_get_contents($path), true) ?? [] as $entry) {
            $species = PetSpecies::firstOrCreate(['name' => $entry['species']]);

            $existing = array_flip($species->breeds()->pluck('name')->all());
            $rows = [];
            foreach ($entry['breeds'] ?? [] as $breed) {
                if (! isset($existing[$breed])) {
                    $rows[] = ['pet_species_id' => $species->id, 'name' => $breed, 'created_at' => now(), 'updated_at' => now()];
                }
            }
            foreach (array_chunk($rows, 500) as $chunk) {
                PetBreed::insertOrIgnore($chunk);
            }
        }
    }
}
