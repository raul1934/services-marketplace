<?php

namespace App\Bots\Console;

use App\Bots\BotGate;
use App\Bots\BotPersona;
use App\Bots\BotRequestFactory;
use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use Illuminate\Console\Command;

/**
 * TEMPORARY — test bots. Posts one request as a random bot client.
 *
 * Scheduled every two minutes so the provider app has a steady trickle of
 * incoming jobs to look at.
 */
class CreateBotRequest extends Command
{
    protected $signature = 'bots:create-request';

    protected $description = 'Create one test request as a bot client (TEMPORARY)';

    public function handle(BotRequestFactory $factory): int
    {
        // Return SUCCESS rather than FAILURE when off: this stays in the
        // schedule until the whole feature is removed, and a disabled bot is
        // not a failed run — it should not show up as a scheduler error.
        if (! BotGate::providerBot()) {
            return self::SUCCESS;
        }

        if ($reason = $this->capReached()) {
            $this->line("Skipped: {$reason}");

            return self::SUCCESS;
        }

        // Collection::random() throws on an empty collection rather than
        // returning null, so check emptiness first.
        $clients = BotPersona::clients();

        if ($clients->isEmpty()) {
            $this->warn('No bot clients — run `php artisan bots:seed` first.');

            return self::SUCCESS;
        }

        $client = $clients->random();

        $request = $factory->create($client);

        if (! $request) {
            $this->warn('Could not build a request (no active category, or no bot market geofence).');

            return self::SUCCESS;
        }

        $this->info("Created test request #{$request->id} as {$client->name}.");

        return self::SUCCESS;
    }

    /**
     * Blast-radius brakes. Every bot request fans out real push notifications to
     * real providers, so these caps are the first dial to turn down in production.
     */
    private function capReached(): ?string
    {
        $open = ServiceRequest::where('is_test', true)
            ->where('status', RequestStatus::Open->value)
            ->count();

        $maxOpen = (int) config('bots.max_open_requests', 10);

        if ($open >= $maxOpen) {
            return "{$open} test requests already open (max {$maxOpen}).";
        }

        $today = ServiceRequest::where('is_test', true)
            ->where('created_at', '>=', now()->startOfDay())
            ->count();

        $maxDay = (int) config('bots.max_requests_per_day', 200);

        if ($today >= $maxDay) {
            return "{$today} test requests already created today (max {$maxDay}).";
        }

        return null;
    }
}
