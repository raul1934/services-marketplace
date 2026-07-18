<?php

namespace App\Services\Social;

use App\Enums\SocialProvider;
use App\Services\Social\Contracts\SocialDriver;
use App\Services\Social\Drivers\FacebookDriver;
use App\Services\Social\Drivers\InstagramDriver;

/**
 * Maps a SocialProvider to its driver. The single place that knows which
 * platforms ship — adding X / Reddit / LinkedIn later is one line here plus the
 * new driver class.
 */
class DriverRegistry
{
    public function for(SocialProvider $provider): SocialDriver
    {
        return match ($provider) {
            SocialProvider::Facebook => app(FacebookDriver::class),
            SocialProvider::Instagram => app(InstagramDriver::class),
        };
    }

    /** Whether a driver exists for the provider (future cases may not yet). */
    public function supports(SocialProvider $provider): bool
    {
        return in_array($provider, [SocialProvider::Facebook, SocialProvider::Instagram], true);
    }
}
