<?php

namespace App\Enums;

enum WarrantyStatus: string
{
    case Open = 'open';
    case Accepted = 'accepted';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
}
