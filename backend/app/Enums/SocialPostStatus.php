<?php

namespace App\Enums;

/**
 * Lifecycle of a composed post. `partial` = at least one target published but
 * another failed (rolled up from social_post_targets in PublishSocialPost).
 */
enum SocialPostStatus: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Publishing = 'publishing';
    case Published = 'published';
    case Failed = 'failed';
    case Partial = 'partial';
}
