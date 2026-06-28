<?php

namespace App\Enums;

/**
 * The kind of asset a request can be tied to (R6 / "fosso"). Mobile assets
 * (vehicles) vs fixed assets (properties) vs pets — keyed to category type.
 */
enum AssetType: string
{
    case Vehicle = 'vehicle';
    case Property = 'property';
    case Pet = 'pet';

    /** The asset type a service category type operates on. */
    public static function forCategoryType(string $categoryType): ?self
    {
        return match ($categoryType) {
            'roadside' => self::Vehicle,
            'residential', 'condo' => self::Property,
            'pet' => self::Pet,
            default => null,
        };
    }
}
