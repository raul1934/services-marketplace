<?php

namespace App\Console\Commands;

use App\Enums\SocialPostStatus;
use App\Jobs\PublishSocialPost;
use App\Models\SocialPost;
use Illuminate\Console\Command;

/**
 * Scheduler (everyMinute): dispatch a publish job for each scheduled post whose
 * scheduled_at has arrived. Flips them to `publishing` first so a subsequent
 * run doesn't double-dispatch.
 */
class PublishDueSocialPosts extends Command
{
    protected $signature = 'social:publish-due';

    protected $description = 'Publish scheduled social posts whose time has come';

    public function handle(): int
    {
        $count = 0;

        SocialPost::where('status', SocialPostStatus::Scheduled->value)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->chunkById(100, function ($posts) use (&$count) {
                foreach ($posts as $post) {
                    $post->update(['status' => SocialPostStatus::Publishing->value]);
                    PublishSocialPost::dispatch($post->id);
                    $count++;
                }
            });

        $this->info("Dispatched {$count} due social post(s).");

        return self::SUCCESS;
    }
}
