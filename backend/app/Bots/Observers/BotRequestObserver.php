<?php

namespace App\Bots\Observers;

use App\Bots\BotGate;
use App\Bots\Jobs\ScheduleBotBids;
use App\Models\ServiceRequest;

/**
 * TEMPORARY — test bots. Kicks off bot bidding when a request is created.
 *
 * An observer rather than a hook inside RequestService::create(): it catches
 * every creation path, is one guarded registration line in AppServiceProvider,
 * and keeps temporary code out of business-critical production code.
 *
 * This runs INLINE on a real user's HTTP request, and production serves the
 * API with `php artisan serve` (single-threaded). It must therefore stay
 * trivial — a config read, one relation lookup, one dispatch. Never do the
 * work here.
 */
class BotRequestObserver
{
    public function created(ServiceRequest $request): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        // Guard on the CLIENT, not on $request->is_test.
        //
        // is_test is stamped by BotRequestFactory *after* RequestService::create()
        // returns — which is after this observer has already fired. Reading
        // is_test here would see false on a bot's own request and the bot
        // providers would end up bidding on requests bot clients posted.
        // client->is_bot is true at creation time, so it is the correct signal.
        if ($request->client?->is_bot) {
            return;
        }

        ScheduleBotBids::dispatch($request->id);
    }
}
