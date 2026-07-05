<?php

namespace App\Enums;

enum CounterOfferStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
}
