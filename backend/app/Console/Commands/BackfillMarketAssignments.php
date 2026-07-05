<?php

namespace App\Console\Commands;

use App\Models\ProviderProfile;
use App\Models\ServiceRequest;
use App\Services\MatchingService;
use Illuminate\Console\Command;

/**
 * Assigns market_id to existing rows that predate a Market (or predate a
 * newly-added one) — idempotent, safe to rerun whenever a Market is created
 * or its boundary edited. Modeled on ExpireStaleRequests's chunkById sweep.
 */
class BackfillMarketAssignments extends Command
{
    protected $signature = 'markets:backfill-locations';

    protected $description = 'Assign market_id to service requests and provider profiles that don\'t have one yet';

    public function handle(MatchingService $matching): int
    {
        $requestCount = 0;
        ServiceRequest::whereNull('market_id')
            ->chunkById(100, function ($requests) use ($matching, &$requestCount) {
                foreach ($requests as $request) {
                    $market = $matching->marketFor((float) $request->latitude, (float) $request->longitude);
                    if ($market) {
                        $request->update(['market_id' => $market->id]);
                        $requestCount++;
                    }
                }
            });

        $providerCount = 0;
        ProviderProfile::whereNull('market_id')
            ->with('user.location')
            ->chunkById(100, function ($profiles) use ($matching, &$providerCount) {
                foreach ($profiles as $profile) {
                    $location = $profile->user?->location;
                    if (! $location) {
                        continue;
                    }
                    $market = $matching->marketFor((float) $location->latitude, (float) $location->longitude);
                    if ($market) {
                        $profile->update(['market_id' => $market->id]);
                        $providerCount++;
                    }
                }
            });

        $this->info("Assigned market to {$requestCount} request(s) and {$providerCount} provider profile(s).");

        return self::SUCCESS;
    }
}
