<?php

namespace Database\Seeders;

use App\Models\Market;
use App\Models\ProviderLocation;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Support\NearbyLocation;
use Database\Seeders\Concerns\SeedsNearbyLocations;
use Illuminate\Database\Seeder;

/**
 * Standard dev/test accounts. Idempotent and guarded against production so a
 * `migrate:fresh --seed` always recreates the same client + provider logins.
 */
class DevUserSeeder extends Seeder
{
    use SeedsNearbyLocations;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        // A dev Market (praça) whose geofence covers the São José do Rio Preto
        // area the dev seeder scatters requests/providers into — so territory
        // isolation (config('matching.territory_isolation')) is testable locally
        // instead of every dev request landing "out of coverage".
        $d = 0.4; // ~44 km box around the scatter centre
        $market = Market::updateOrCreate(
            ['name' => 'São José do Rio Preto (dev)'],
            [
                'is_active' => true,
                'geofence' => [
                    ['latitude' => NearbyLocation::CENTER_LAT - $d, 'longitude' => NearbyLocation::CENTER_LNG - $d],
                    ['latitude' => NearbyLocation::CENTER_LAT - $d, 'longitude' => NearbyLocation::CENTER_LNG + $d],
                    ['latitude' => NearbyLocation::CENTER_LAT + $d, 'longitude' => NearbyLocation::CENTER_LNG + $d],
                    ['latitude' => NearbyLocation::CENTER_LAT + $d, 'longitude' => NearbyLocation::CENTER_LNG - $d],
                ],
            ],
        );

        User::updateOrCreate(
            ['email' => 'cliente@chamafacil.test'],
            [
                'name' => 'Cliente Teste',
                'password' => 'senha123', // 'hashed' cast applies bcrypt
                'is_client' => true,
                'is_provider' => false,
            ],
        );

        // Full-access dev provider: holds every role (client + provider + admin)
        // so it can exercise any flow in the apps and the Filament panel.
        $provider = User::updateOrCreate(
            ['email' => 'prestador@chamafacil.test'],
            [
                'name' => 'Prestador Teste',
                'password' => 'senha123', // 'hashed' cast applies bcrypt
                'is_client' => true,
                'is_provider' => true,
                'is_admin' => true,
            ],
        );

        // Pre-approve the dev provider and give it a profile so it lands
        // straight on the dashboard (skips the onboarding + "em análise" locks).
        ProviderProfile::updateOrCreate(
            ['user_id' => $provider->id],
            [
                'company_name' => 'Prestador Teste',
                'is_approved' => true,
                'is_online' => true, // active and visible in the feed right away
                'market_id' => $market->id, // assigned to the dev praça (territory)
                'coverage_radius_km' => 30,
                'plan' => \App\Enums\ProviderPlan::Pro->value, // showcase a paid plan + expiry
                'plan_expires_at' => now()->addMonths(8),
            ],
        );

        // Serve every category so the full request feed is visible.
        $provider->categories()->sync(
            ServiceCategory::where('is_active', true)->pluck('id')->all(),
        );

        // Place the provider near the seeded requests (São José do Rio Preto, SP).
        ProviderLocation::updateOrCreate(
            ['user_id' => $provider->id],
            $this->randomNearbyLocation(),
        );
    }
}
