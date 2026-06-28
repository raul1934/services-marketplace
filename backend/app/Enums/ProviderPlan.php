<?php

namespace App\Enums;

/**
 * Provider subscription plan. Higher plans take a lower per-job commission
 * (see the marketing landing page). Stored on provider_profiles.plan.
 */
enum ProviderPlan: string
{
    case Free = 'free';
    case Pro = 'pro';
    case Enterprise = 'enterprise';

    /** Platform commission taken from each completed job, by plan. */
    public function commissionRate(): float
    {
        return match ($this) {
            self::Free => 0.05,
            self::Pro => 0.025,
            self::Enterprise => 0.01,
        };
    }

    /** Monthly subscription price in BRL. */
    public function monthlyPrice(): int
    {
        return match ($this) {
            self::Free => 0,
            self::Pro => 99,
            self::Enterprise => 299,
        };
    }
}
