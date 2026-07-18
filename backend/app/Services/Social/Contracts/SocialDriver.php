<?php

namespace App\Services\Social\Contracts;

use App\Models\SocialConnection;
use App\Models\SocialPost;
use App\Models\SocialPostTarget;

/**
 * One implementation per platform. Adding X / Reddit / LinkedIn later is just a
 * new class here + a SocialProvider case + a DriverRegistry binding — no schema
 * or Filament change (the tables and resources already generalize).
 */
interface SocialDriver
{
    /**
     * Publish the post through the given connection.
     *
     * @return array{external_id: string, permalink: ?string}
     */
    public function publish(SocialPost $post, SocialConnection $connection): array;

    /**
     * Read interactions for a published target.
     *
     * @return array{likes_count:int, comments_count:int, comments:array<int, array{external_id:string, author_name:?string, text:?string, posted_at:?string}>}
     */
    public function fetchInteractions(SocialPostTarget $target): array;
}
