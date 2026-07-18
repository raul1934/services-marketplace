<?php

namespace App\Jobs;

use App\Enums\SocialPostStatus;
use App\Enums\SocialTargetStatus;
use App\Models\SocialPost;
use App\Services\Social\DriverRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Fans a composed post out to each of its pending targets, persisting the
 * platform post id / permalink or the error per target, then rolls the post
 * status up to published / partial / failed.
 */
class PublishSocialPost implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $postId) {}

    public function handle(DriverRegistry $registry): void
    {
        $post = SocialPost::with(['targets.connection', 'media'])->find($this->postId);

        if (! $post) {
            return;
        }

        $pending = $post->targets->where('status', SocialTargetStatus::Pending);

        if ($pending->isEmpty()) {
            return;
        }

        foreach ($pending as $target) {
            $connection = $target->connection;

            if (! $connection || ! $connection->is_active || ! $registry->supports($target->provider)) {
                $target->update([
                    'status' => SocialTargetStatus::Failed->value,
                    'error' => 'No active connection / driver for this target.',
                ]);

                continue;
            }

            try {
                $result = $registry->for($target->provider)->publish($post, $connection);

                $target->update([
                    'status' => SocialTargetStatus::Published->value,
                    'external_id' => $result['external_id'],
                    'permalink' => $result['permalink'] ?? null,
                    'error' => null,
                    'published_at' => now(),
                ]);
            } catch (\Throwable $e) {
                Log::warning("Social publish failed for target {$target->id}: ".$e->getMessage());

                $target->update([
                    'status' => SocialTargetStatus::Failed->value,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $post->update(['status' => $this->rollUp($post)->value]);
    }

    /** Aggregate per-target outcomes into the post's status. */
    private function rollUp(SocialPost $post): SocialPostStatus
    {
        // pluck applies the enum cast, so normalize to backing values before
        // comparing (a target's status may be an enum instance or a string).
        $statuses = $post->targets()->pluck('status')
            ->map(fn ($s) => $s instanceof SocialTargetStatus ? $s->value : $s);

        $published = $statuses->contains(SocialTargetStatus::Published->value);
        $failed = $statuses->contains(SocialTargetStatus::Failed->value);
        $pending = $statuses->contains(SocialTargetStatus::Pending->value);

        return match (true) {
            $published && ($failed || $pending) => SocialPostStatus::Partial,
            $published => SocialPostStatus::Published,
            default => SocialPostStatus::Failed,
        };
    }
}
