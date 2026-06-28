<?php

namespace App\Enums;

enum Weekday: string
{
    case Monday = 'mon';
    case Tuesday = 'tue';
    case Wednesday = 'wed';
    case Thursday = 'thu';
    case Friday = 'fri';
    case Saturday = 'sat';
    case Sunday = 'sun';

    public function label(): string
    {
        return match ($this) {
            self::Monday => 'Segunda',
            self::Tuesday => 'Terça',
            self::Wednesday => 'Quarta',
            self::Thursday => 'Quinta',
            self::Friday => 'Sexta',
            self::Saturday => 'Sábado',
            self::Sunday => 'Domingo',
        };
    }
}
