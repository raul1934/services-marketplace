<?php

namespace App\Enums;

/** What the client wants from the warranty: redo the service, or a refund. */
enum WarrantyType: string
{
    case Redo = 'redo';
    case Refund = 'refund';
}
