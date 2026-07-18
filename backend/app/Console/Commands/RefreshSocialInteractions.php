<?php

namespace App\Console\Commands;

use App\Enums\SocialTargetStatus;
use App\Jobs\PollSocialInteractions;
use App\Models\SocialPostTarget;
use Illuminate\Console\Command;

/**
 * Scheduler (everyTenMinutes): dispatch an interactions poll for each published
 * target so like/comment counts + comment text stay current in the admin.
 */
class RefreshSocialInteractions extends Command
{
    protected $signature = 'social:refresh-interactions';

    protected $description = 'Refresh like/comment counts and comments for published social targets';

    public function handle(): int
    {
        $count = 0;

        SocialPostTarget::where('status', SocialTargetStatus::Published->value)
            ->whereNotNull('external_id')
            ->chunkById(100, function ($targets) use (&$count) {
                foreach ($targets as $target) {
                    PollSocialInteractions::dispatch($target->id);
                    $count++;
                }
            });

        $this->info("Dispatched {$count} interaction poll(s).");

        return self::SUCCESS;
    }
}
