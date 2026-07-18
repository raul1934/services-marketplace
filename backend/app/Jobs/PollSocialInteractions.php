<?php

namespace App\Jobs;

use App\Enums\SocialTargetStatus;
use App\Models\SocialPostTarget;
use App\Services\Social\DriverRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

/**
 * Reads interactions for one published target: refreshes like/comment counts
 * and upserts the comment text (keyed on external_id so re-polling doesn't
 * duplicate).
 */
class PollSocialInteractions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $targetId) {}

    public function handle(DriverRegistry $registry): void
    {
        $target = SocialPostTarget::with('connection')->find($this->targetId);

        if (! $target
            || $target->status !== SocialTargetStatus::Published
            || ! $target->external_id
            || ! $target->connection
            || ! $registry->supports($target->provider)) {
            return;
        }

        $data = $registry->for($target->provider)->fetchInteractions($target);

        $target->update([
            'likes_count' => $data['likes_count'],
            'comments_count' => $data['comments_count'],
            'metrics_refreshed_at' => now(),
        ]);

        foreach ($data['comments'] as $comment) {
            $target->comments()->updateOrCreate(
                ['external_id' => $comment['external_id']],
                [
                    'author_name' => $comment['author_name'] ?? null,
                    'text' => $comment['text'] ?? null,
                    'posted_at' => isset($comment['posted_at']) ? Carbon::parse($comment['posted_at']) : null,
                ],
            );
        }
    }
}
