<?php

namespace App\Enums;

/**
 * Approval tier of a surcharge, by its accumulated % over the original
 * combinado (R-ACRÉSCIMO): ≤15% simple slide-to-confirm · 15–50% reinforced
 * approval with justification · >50% mandatory re-quote.
 */
enum SurchargeTier: string
{
    case Simple = 'simple';
    case Reinforced = 'reinforced';
    case Requote = 'requote';

    public static function fromPercent(float $percentAccumulated): self
    {
        return match (true) {
            $percentAccumulated > 50 => self::Requote,
            $percentAccumulated > 15 => self::Reinforced,
            default => self::Simple,
        };
    }
}
