<?php

namespace App\Services\Social\Drivers;

use App\Models\SocialConnection;
use App\Models\SocialPost;
use App\Models\SocialPostTarget;
use App\Services\Social\Contracts\SocialDriver;
use App\Services\Social\MetaGraphClient;
use RuntimeException;

/**
 * Publishes to a Facebook Page. Text/link posts go to /{page}/feed; if the post
 * has an image, it goes to /{page}/photos (a public HTTPS url is required).
 */
class FacebookDriver implements SocialDriver
{
    public function __construct(private MetaGraphClient $graph) {}

    public function publish(SocialPost $post, SocialConnection $connection): array
    {
        $pageId = $connection->external_id;
        $token = $connection->access_token;
        $imageUrl = $post->imageUrl();

        $postId = $imageUrl
            ? $this->graph->createPagePhotoPost($pageId, $token, $imageUrl, $post->caption)
            : $this->graph->createPageFeedPost($pageId, $token, $post->caption);

        if (! $postId) {
            throw new RuntimeException('Facebook publish returned no post id.');
        }

        return [
            'external_id' => $postId,
            // FB post ids are "{page}_{post}"; the page-qualified id resolves.
            'permalink' => 'https://www.facebook.com/'.$postId,
        ];
    }

    public function fetchInteractions(SocialPostTarget $target): array
    {
        $token = $target->connection->access_token;
        $postId = $target->external_id;

        $summary = $this->graph->facebookPostSummary($postId, $token);
        $comments = $this->graph->facebookComments($postId, $token);

        return [
            'likes_count' => $summary['likes_count'],
            'comments_count' => $summary['comments_count'],
            'comments' => $comments,
        ];
    }
}
