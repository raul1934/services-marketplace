<?php

namespace App\Enums;

enum SurchargeStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Refused = 'refused';
}
