<?php

namespace App\Enums;

/**
 * Discriminator so the marketplace can expand beyond roadside (the MVP focus)
 * to residential / condominium services later without schema changes.
 */
enum CategoryType: string
{
    case Roadside = 'roadside';
    case Residential = 'residential';
    case Condo = 'condo';
    case Beauty = 'beauty';
    case Pet = 'pet';
}
