<?php

namespace App\Enums;

/** Whether the customer needs help now or within scheduled windows. */
enum RequestUrgency: string
{
    case Urgent = 'urgent';       // needs help right now
    case Scheduled = 'scheduled'; // available within given time windows

    public function label(): string
    {
        return match ($this) {
            self::Urgent => 'Urgente',
            self::Scheduled => 'Agendado',
        };
    }
}
