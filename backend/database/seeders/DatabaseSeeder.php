<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
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
        $this->call(ServiceRequestSeeder::class);
        $this->call(DevJobSeeder::class);
        $this->call(AssetHistorySeeder::class);
    }
}
