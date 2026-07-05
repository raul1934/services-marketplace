<?php

namespace App\Enums;

enum ProposalStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
    /** Customer explicitly dismissed this one bid — distinct from the silent
     *  Rejected status the losing bids get when a different proposal is accepted. */
    case Declined = 'declined';
}
