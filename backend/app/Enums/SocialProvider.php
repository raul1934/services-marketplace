<?php

namespace App\Enums;

/**
 * A social platform we can publish to. Only Facebook + Instagram ship now;
 * X / Reddit / LinkedIn are additive later — a new case here plus a matching
 * SocialDriver implementation, no schema change (see DriverRegistry).
 */
enum SocialProvider: string
{
    case Facebook = 'facebook';
    case Instagram = 'instagram';

    // Future platforms — add the case + a SocialDriver, nothing else changes:
    // case X = 'x';
    // case Reddit = 'reddit';
    // case LinkedIn = 'linkedin';

    public function label(): string
    {
        return match ($this) {
            self::Facebook => 'Facebook',
            self::Instagram => 'Instagram',
        };
    }
}
