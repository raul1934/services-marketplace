<?php

namespace App\Enums;

/** How a provider declares availability. */
enum AvailabilityType: string
{
    case Always = 'always';       // 24 hours a day, every day
    case Scheduled = 'scheduled'; // specific weekly time windows

    public function label(): string
    {
        return match ($this) {
            self::Always => '24 horas',
            self::Scheduled => 'Horários definidos',
        };
    }
}
