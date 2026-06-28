<?php

namespace App\Enums;

/** How the provider will be received at a residential / on-site job. */
enum ReceptionType: string
{
    case AdultKey = 'adult_key';
    case EntryCode = 'entry_code';
}
