<?php

namespace App\Enums;

/** What was done with a part during the service. */
enum PartAction: string
{
    case Replaced = 'replaced';
    case Adjusted = 'adjusted';
    case Added = 'added';
    case Cleaned = 'cleaned';

    public function label(): string
    {
        return match ($this) {
            self::Replaced => 'Trocado',
            self::Adjusted => 'Ajustado',
            self::Added => 'Adicionado',
            self::Cleaned => 'Limpo',
        };
    }
}
