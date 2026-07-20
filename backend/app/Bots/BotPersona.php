<?php

namespace App\Bots;

use App\Models\Market;
use App\Models\User;
use App\Support\Geofence;
use Illuminate\Support\Collection;

/**
 * TEMPORARY — test bots. Resolves the bot cast: which accounts exist, which
 * territory they operate in, and where inside it they are.
 *
 * Everything that needs "give me a bot" goes through here so the identity
 * rules (email shape, market resolution) live in exactly one place.
 */
class BotPersona
{
    public const CLIENT_PREFIX = 'bot-client-';

    public const PROVIDER_PREFIX = 'bot-provider-';

    public static function clientEmail(int $n): string
    {
        return self::CLIENT_PREFIX.$n.'@'.config('bots.email_domain');
    }

    public static function providerEmail(int $n): string
    {
        return self::PROVIDER_PREFIX.$n.'@'.config('bots.email_domain');
    }

    /** Display name, deliberately unmistakable in the apps and in Filament. */
    public static function clientName(int $n): string
    {
        return sprintf('TEST Customer %02d', $n);
    }

    public static function providerName(int $n): string
    {
        return sprintf('TEST Provider %02d', $n);
    }

    /** @return Collection<int, User> */
    public static function clients(): Collection
    {
        return User::query()
            ->where('is_bot', true)
            ->where('is_client', true)
            ->orderBy('id')
            ->get();
    }

    /**
     * Bot providers eligible to bid. Ordered by id so the caller can shuffle
     * deterministically in tests.
     *
     * @return Collection<int, User>
     */
    public static function providers(): Collection
    {
        return User::query()
            ->where('is_bot', true)
            ->where('is_provider', true)
            ->orderBy('id')
            ->get();
    }

    /**
     * A single representative territory — BOTS_MARKET_ID when pinned, else the
     * lowest-id active market. Used where one market has to be named (the seed
     * command's summary, sanity checks). For posting requests use
     * {@see randomMarket()}, which spreads across every territory.
     *
     * A market is NEVER created here: with territory isolation on, a synthetic
     * geofence overlapping a real city would start pulling real customers'
     * requests into the bot territory and routing them to bot providers. In
     * production this must be a real market; locally the dev seeder's market
     * satisfies it with no configuration.
     */
    public static function market(): ?Market
    {
        $id = config('bots.market_id');

        if ($id) {
            return Market::find($id);
        }

        return self::markets()->first();
    }

    /**
     * Every territory the bots may operate in — all active markets with a
     * geofence, or just the pinned one when BOTS_MARKET_ID is set.
     *
     * @return Collection<int, Market>
     */
    public static function markets(): Collection
    {
        $id = config('bots.market_id');

        return Market::query()
            ->where('is_active', true)
            ->whereNotNull('geofence')
            ->when($id, fn ($q) => $q->whereKey($id))
            ->orderBy('id')
            ->get();
    }

    /**
     * A market to post the next request in. Random across all active markets so
     * coverage spreads over every territory instead of piling into the first
     * one; pin with BOTS_MARKET_ID to confine them again.
     */
    public static function randomMarket(): ?Market
    {
        $markets = self::markets();

        return $markets->isEmpty() ? null : $markets->random();
    }

    /**
     * A random point inside a market, for a request location or a provider's
     * position. Falls back to the market centroid when the geofence is too
     * awkward to sample (see Geofence::randomPointInside).
     *
     * @return array{latitude: float, longitude: float}|null
     */
    public static function randomPoint(?Market $market = null): ?array
    {
        $market ??= self::randomMarket();

        if (! $market || ! is_array($market->geofence)) {
            return null;
        }

        return Geofence::randomPointInside($market->geofence) ?? $market->centroid();
    }
}
