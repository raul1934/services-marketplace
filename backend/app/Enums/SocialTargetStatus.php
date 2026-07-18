<?php

namespace App\Enums;

/** Publish state of a single (post, platform) target. */
enum SocialTargetStatus: string
{
    case Pending = 'pending';
    case Published = 'published';
    case Failed = 'failed';
}
