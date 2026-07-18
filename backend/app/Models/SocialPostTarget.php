<?php

namespace App\Models;

use App\Enums\SocialProvider;
use App\Enums\SocialTargetStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The fan-out of a post to one platform. Carries the platform's own post id and
 * the polled interaction counts; comments live in the related social_comments.
 */
class SocialPostTarget extends Model
{
    protected $fillable = [
        'social_post_id', 'provider', 'social_connection_id', 'status',
        'external_id', 'permalink', 'error', 'published_at',
        'likes_count', 'comments_count', 'metrics_refreshed_at',
    ];

    protected $casts = [
        'provider' => SocialProvider::class,
        'status' => SocialTargetStatus::class,
        'published_at' => 'datetime',
        'metrics_refreshed_at' => 'datetime',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(SocialPost::class, 'social_post_id');
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(SocialConnection::class, 'social_connection_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(SocialComment::class)->orderByDesc('posted_at');
    }
}
