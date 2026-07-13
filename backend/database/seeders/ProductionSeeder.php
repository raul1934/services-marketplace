<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Reference/catalog data safe to (re)run on EVERY deploy — all idempotent
 * (updateOrCreate / firstOrCreate). Excludes the dev/demo seeders in
 * DatabaseSeeder (DevUser, Asset, ServiceRequest, DevJob, AssetHistory,
 * Presentation), which must never run in production.
 *
 * The CI/CD deploy runs: php artisan db:seed --class=Database\\Seeders\\ProductionSeeder --force
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ServiceCategorySeeder::class,
            QuestionSeeder::class,
            QuestionSuggestionSeeder::class,
            VehicleCatalogSeeder::class,
            PropertyTypeSeeder::class,
            PetCatalogSeeder::class,
        ]);
    }
}
