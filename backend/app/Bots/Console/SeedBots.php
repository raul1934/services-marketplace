<?php

namespace App\Bots\Console;

use App\Bots\BotAssets;
use App\Bots\BotPersona;
use App\Enums\ProviderPlan;
use App\Models\ProviderLocation;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * TEMPORARY — test bots. Creates the bot cast.
 *
 * A command rather than a seeder on purpose: ProductionSeeder runs on every
 * deploy, so bot accounts placed there would silently come back after you
 * delete them, and would couple the deploy pipeline to a temporary feature.
 * This is run by hand, once, per environment.
 *
 * Idempotent (updateOrCreate keyed on email), so re-running it is safe and
 * repairs drift rather than duplicating accounts.
 */
class SeedBots extends Command
{
    protected $signature = 'bots:seed';

    protected $description = 'Create/refresh the test bot accounts (TEMPORARY)';

    public function handle(): int
    {
        $markets = BotPersona::markets()
            ->filter(fn ($m) => is_array($m->geofence) && count($m->geofence) >= 3)
            ->values();

        if ($markets->isEmpty()) {
            $this->error('No usable bot market available (needs an active market with a geofence).');
            $this->line('Set BOTS_MARKET_ID to one, or create one.');
            $this->line('A market is never auto-created: under territory isolation a synthetic');
            $this->line('geofence over a real city would capture real customers into bot territory.');

            return self::FAILURE;
        }

        $count = max(1, (int) config('bots.count', 5));
        $password = config('bots.password');
        $categoryIds = ServiceCategory::where('is_active', true)->pluck('id')->all();

        if ($categoryIds === []) {
            $this->error('No active service categories — run the ProductionSeeder first.');

            return self::FAILURE;
        }

        $this->info('Markets: '.$markets->map(fn ($m) => "#{$m->id} {$m->name}")->implode(', '));

        for ($n = 1; $n <= $count; $n++) {
            $client = User::updateOrCreate(
                ['email' => BotPersona::clientEmail($n)],
                [
                    'name' => BotPersona::clientName($n),
                    'password' => $password, // 'hashed' cast applies bcrypt
                    'is_client' => true,
                    'is_provider' => false,
                    'is_bot' => true,
                ],
            );

            // One asset of each type, so a bot request can name the "bem" it's
            // about whatever category it lands on. Without this the asset card
            // on the request screen renders nothing.
            BotAssets::seedFor($client);
        }

        for ($n = 1; $n <= $count; $n++) {
            $provider = User::updateOrCreate(
                ['email' => BotPersona::providerEmail($n)],
                [
                    'name' => BotPersona::providerName($n),
                    'password' => $password,
                    'is_client' => false,
                    'is_provider' => true,
                    'is_bot' => true,
                ],
            );

            // Spread the bot providers round-robin across the available markets
            // rather than piling them into one. market_id does NOT gate their
            // bidding — SubmitBotBid calls ProposalService in-process, which
            // checks neither market nor category, so a bot bids on any request
            // anywhere. It only decides what a human sees if they log into the
            // account, and keeps the profile coherent in Filament.
            $market = $markets[($n - 1) % $markets->count()];

            ProviderProfile::updateOrCreate(
                ['user_id' => $provider->id],
                [
                    'company_name' => BotPersona::providerName($n),
                    'is_approved' => true,
                    'is_online' => true,
                    'market_id' => $market->id,
                    'coverage_radius_km' => 30,
                    'plan' => ProviderPlan::Free->value,
                ],
            );

            $provider->categories()->sync($categoryIds);

            $point = BotPersona::randomPoint($market);

            if ($point) {
                ProviderLocation::updateOrCreate(['user_id' => $provider->id], $point);
            }
        }

        $this->info("Seeded {$count} bot client(s) and {$count} bot provider(s).");
        $this->line('Password: '.$password);
        $this->newLine();
        $this->warn('Bots stay inert until BOTS_ENABLED=true (then `php artisan config:clear`).');

        return self::SUCCESS;
    }
}
