<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * The app's `icon` columns (ServiceCategory, etc.) store keys from the mobile
 * app's own icon set (see frontend/packages/shared/src/ui/Icon.tsx), not
 * Heroicon/Lucide names directly — mapped here to the matching lucide-static
 * filename. Shared between ServiceCategoryResource and the admin live map so
 * both render the exact icon a customer/provider actually sees.
 */
class LucideIcon
{
    private const MAP = [
        'arrowR' => 'arrow-right', 'back' => 'arrow-left', 'battery' => 'battery-charging',
        'bell' => 'bell', 'briefcase' => 'briefcase', 'calendar' => 'calendar', 'camera' => 'camera',
        'car' => 'car', 'card' => 'credit-card', 'cash' => 'banknote', 'chat' => 'message-circle',
        'check' => 'check', 'chevronsR' => 'chevrons-right', 'clock' => 'clock', 'close' => 'x',
        'dollar' => 'dollar-sign', 'drop' => 'droplet', 'edit' => 'square-pen', 'filter' => 'sliders-horizontal',
        'flash' => 'zap', 'fwd' => 'corner-up-right', 'grip' => 'grip-vertical', 'heart' => 'heart',
        'home' => 'home', 'key' => 'key', 'list' => 'list', 'menu' => 'menu', 'location' => 'map-pin',
        'mail' => 'mail', 'mic' => 'mic', 'minus' => 'minus', 'navigate' => 'navigation', 'paw' => 'paw-print',
        'phone' => 'phone', 'pin' => 'pin', 'pix' => 'qr-code', 'plus' => 'plus', 'power' => 'power',
        'scissors' => 'scissors', 'search' => 'search', 'settings' => 'settings', 'shield' => 'shield',
        'shieldCheck' => 'shield-check', 'sparkles' => 'sparkles', 'star' => 'star', 'truck' => 'truck',
        'user' => 'user', 'wifi' => 'wifi', 'wrench' => 'wrench', 'userX' => 'user-x',
    ];

    /**
     * Raw SVG markup (not a URL) — lucide's source uses stroke="currentColor",
     * so it only actually inherits the surrounding color when embedded
     * inline. An <img src="..."> can't do that (rasterized in isolation), and
     * fetching it at render time on every caller adds a network round trip.
     */
    public static function svg(?string $key): ?string
    {
        $lucideName = self::MAP[$key] ?? null;
        if (! $lucideName) {
            return null;
        }

        return Cache::rememberForever("lucide-icon-svg:{$lucideName}", function () use ($lucideName) {
            $response = Http::get("https://unpkg.com/lucide-static@latest/icons/{$lucideName}.svg");

            return $response->successful() ? $response->body() : null;
        });
    }

    /** Pre-fetch a batch of icon keys into a [key => svg] map, skipping unknown/missing ones. */
    public static function svgMap(iterable $keys): array
    {
        $svgs = [];
        foreach (array_unique(array_filter([...$keys])) as $key) {
            if ($svg = self::svg($key)) {
                $svgs[$key] = $svg;
            }
        }

        return $svgs;
    }
}
