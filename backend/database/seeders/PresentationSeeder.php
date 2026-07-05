<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Lean seed for live demos / presentations: reference data (categories,
 * questions, catalogs), the demo accounts and their assets — but NO service
 * requests, jobs or history. The presenter creates requests live, and the
 * provider feeds start clean. Meant to run against a separate database
 * (e.g. `guincho_presentation`), leaving the dev `guincho` DB untouched.
 */
class PresentationSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(ServiceCategorySeeder::class);
        $this->call(QuestionSeeder::class);
        $this->call(QuestionSuggestionSeeder::class);
        $this->call(DevUserSeeder::class);
        $this->call(VehicleCatalogSeeder::class);
        $this->call(PropertyTypeSeeder::class);
        $this->call(PetCatalogSeeder::class);
        $this->call(AssetSeeder::class);
        // Intentionally NO ServiceRequestSeeder / DevJobSeeder / AssetHistorySeeder.
    }
}
