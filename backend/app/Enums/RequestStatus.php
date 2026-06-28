<?php

namespace App\Enums;

enum RequestStatus: string
{
    case Open = 'open';
    case Accepted = 'accepted';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    // Paused on a mandatory re-quote (surcharge >50% or scope change): the
    // client must accept the present provider's new quote or reopen to others.
    case Requote = 'requote';

    /** Statuses where a provider is assigned and the job is live (used for tracking). */
    public function isActive(): bool
    {
        return in_array($this, [self::Accepted, self::InProgress], true);
    }

    /** Terminal statuses where no further action is expected. */
    public function isClosed(): bool
    {
        return in_array($this, [self::Completed, self::Cancelled, self::Expired], true);
    }
}
