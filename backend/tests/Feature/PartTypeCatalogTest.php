<?php

namespace Tests\Feature;

use App\Models\PartType;
use App\Models\PropertyType;
use App\Models\User;
use Database\Seeders\PartTypeSeeder;
use Database\Seeders\PropertyTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PartTypeCatalogTest extends TestCase
{
    use RefreshDatabase;

    /** Named seedCatalog: TestCase::seed() already exists and is public. */
    private function seedCatalog(): void
    {
        $this->seed(PropertyTypeSeeder::class);
        $this->seed(PartTypeSeeder::class);
    }

    public function test_edicula_is_in_the_catalog_and_suggests_a_pool_by_default(): void
    {
        $this->seedCatalog();
        Sanctum::actingAs(User::factory()->create(), ['client']);

        $res = $this->getJson('/api/customer/v1/property-types')->assertOk();

        $edicula = collect($res->json('data'))->firstWhere('name', 'Edícula');
        $this->assertNotNull($edicula, 'Edícula should be a property type');

        $pool = collect($edicula['part_types'])->firstWhere('slug', 'piscina');
        $this->assertNotNull($pool, 'an edícula should offer a pool');
        $this->assertTrue($pool['default_selected'], 'an edícula almost always has one — pre-tick it');
    }

    public function test_a_house_offers_a_pool_but_does_not_assume_one(): void
    {
        $this->seedCatalog();
        Sanctum::actingAs(User::factory()->create(), ['client']);

        $res = $this->getJson('/api/customer/v1/property-types')->assertOk();
        $casa = collect($res->json('data'))->firstWhere('name', 'Casa');

        $pool = collect($casa['part_types'])->firstWhere('slug', 'piscina');
        $this->assertNotNull($pool, 'a house can have a pool');
        $this->assertFalse($pool['default_selected'], 'but most do not — offer it unticked');
    }

    public function test_property_types_suggest_different_parts(): void
    {
        $this->seedCatalog();
        Sanctum::actingAs(User::factory()->create(), ['client']);

        $data = collect($this->getJson('/api/customer/v1/property-types')->assertOk()->json('data'));
        $slugs = fn (string $name) => collect($data->firstWhere('name', $name)['part_types'])->pluck('slug');

        // A flat has no yard; a house does. The whole point of the catalog.
        $this->assertFalse($slugs('Apartamento')->contains('quintal'));
        $this->assertTrue($slugs('Casa')->contains('quintal'));
        $this->assertTrue($slugs('Garagem/Vaga')->count() < $slugs('Casa')->count());
    }

    public function test_seeding_twice_does_not_duplicate(): void
    {
        $this->seedCatalog();
        $parts = PartType::count();
        $links = PropertyType::where('name', 'Edícula')->first()->partTypes()->count();

        $this->seedCatalog();

        $this->assertSame($parts, PartType::count());
        $this->assertSame($links, PropertyType::where('name', 'Edícula')->first()->partTypes()->count());
    }

    public function test_a_part_is_shared_across_property_types_not_duplicated(): void
    {
        $this->seedCatalog();

        // "Sala" is one row serving many types — that's why the pivot is
        // many-to-many rather than a foreign key per type.
        $this->assertSame(1, PartType::where('slug', 'sala')->count());
        $this->assertGreaterThan(1, PartType::where('slug', 'sala')->first()->propertyTypes()->count());
    }
}
