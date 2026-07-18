<?php

namespace App\Services\Social;

use App\Enums\SocialPostStatus;
use App\Enums\SocialTargetStatus;
use App\Jobs\PublishSocialPost;
use App\Models\SocialConnection;
use App\Models\SocialPost;

/**
 * Orchestrates composing → publishing. The Filament action delegates here (like
 * DisputeResource → DisputeService): it materializes the per-platform targets
 * from the selected connections and dispatches the publish job.
 */
class SocialPublishing
{
    /**
     * Reconcile a post's targets with the chosen connection ids. Targets that
     * were already published are left untouched; unpicked pending ones are
     * dropped so an edit can still change the audience before publishing.
     *
     * @param  iterable<int|string>  $connectionIds
     */
    public function syncTargets(SocialPost $post, iterable $connectionIds): void
    {
        $ids = array_values(array_filter(array_map('intval', (array) $connectionIds)));

        $connections = SocialConnection::whereIn('id', $ids)->get();

        foreach ($connections as $connection) {
            $post->targets()->firstOrCreate(
                ['social_connection_id' => $connection->id],
                [
                    'provider' => $connection->provider->value,
                    'status' => SocialTargetStatus::Pending->value,
                ],
            );
        }

        // Drop pending targets no longer selected (never touch published ones).
        $post->targets()
            ->where('status', SocialTargetStatus::Pending->value)
            ->whereNotIn('social_connection_id', $ids)
            ->delete();
    }

    /**
     * Publish immediately: clear any schedule, flag as publishing, dispatch the
     * job that fans out to each target.
     */
    public function publishNow(SocialPost $post): void
    {
        $post->update([
            'scheduled_at' => null,
            'status' => SocialPostStatus::Publishing->value,
        ]);

        PublishSocialPost::dispatch($post->id);
    }
}
