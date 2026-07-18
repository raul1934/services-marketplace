<?php

namespace App\Services\Social\Drivers;

use App\Models\SocialConnection;
use App\Models\SocialPost;
use App\Models\SocialPostTarget;
use App\Services\Social\Contracts\SocialDriver;
use App\Services\Social\MetaGraphClient;
use RuntimeException;

/**
 * Publishes to an Instagram Business/Creator account. IG always needs an image:
 * create a media container from a public HTTPS url, then publish it. Requires a
 * publicly reachable image url — works in prod, not local dev.
 */
class InstagramDriver implements SocialDriver
{
    public function __construct(private MetaGraphClient $graph) {}

    public function publish(SocialPost $post, SocialConnection $connection): array
    {
        $igUserId = $connection->external_id;
        $token = $connection->access_token;
        $imageUrl = $post->imageUrl();

        if (! $imageUrl) {
            throw new RuntimeException('Instagram requires an image; none attached to this post.');
        }

        $creationId = $this->graph->createInstagramContainer($igUserId, $token, $imageUrl, $post->caption);
        if (! $creationId) {
            throw new RuntimeException('Instagram container creation returned no id.');
        }

        $mediaId = $this->graph->publishInstagramContainer($igUserId, $token, $creationId);
        if (! $mediaId) {
            throw new RuntimeException('Instagram media_publish returned no id.');
        }

        return [
            'external_id' => $mediaId,
            'permalink' => null,
        ];
    }

    public function fetchInteractions(SocialPostTarget $target): array
    {
        $token = $target->connection->access_token;
        $mediaId = $target->external_id;

        $summary = $this->graph->instagramMediaSummary($mediaId, $token);
        $comments = $this->graph->instagramComments($mediaId, $token);

        return [
            'likes_count' => $summary['likes_count'],
            'comments_count' => $summary['comments_count'],
            'comments' => $comments,
        ];
    }
}
