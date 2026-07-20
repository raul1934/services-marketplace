<?php

namespace App\Bots;

use Illuminate\Support\Facades\Cache;

/**
 * TEMPORARY — test bots. The single place that decides whether any bot code
 * may run.
 *
 * Two layers on purpose. `config('bots.enabled')` is the deploy-time switch,
 * but changing it in production needs a container restart. The cache flag is
 * the runtime kill switch (`php artisan bots:kill`), which takes effect on the
 * next check with no restart.
 *
 * Every entry point calls this — including inside each job's handle(), not
 * only at dispatch time. Bot bids are dispatched with a delay, so work already
 * sitting in the queue must stop too when the switch is thrown.
 */
class BotGate
{
    public const KILL_KEY = 'bots:killed';

    public static function enabled(): bool
    {
        return (bool) config('bots.enabled') && ! Cache::get(self::KILL_KEY, false);
    }

    /** Fake providers bidding on requests (drives the customer app). */
    public static function customerBot(): bool
    {
        return self::enabled() && (bool) config('bots.customer_bot');
    }

    /** Fake clients posting requests (drives the provider app). */
    public static function providerBot(): bool
    {
        return self::enabled() && (bool) config('bots.provider_bot');
    }

    /** Bot clients auto-advancing a job a real provider took. */
    public static function autoAdvance(): bool
    {
        return self::enabled() && (bool) config('bots.auto_advance');
    }

    /** Stop all bot activity, including work already queued. Survives restarts. */
    public static function kill(): void
    {
        Cache::forever(self::KILL_KEY, true);
    }

    public static function revive(): void
    {
        Cache::forget(self::KILL_KEY);
    }

    public static function isKilled(): bool
    {
        return (bool) Cache::get(self::KILL_KEY, false);
    }

    /** Prefix every user-visible bot string, so a human always sees what it is. */
    public static function label(string $text): string
    {
        return trim(config('bots.label', '[TESTE]').' '.$text);
    }
}
