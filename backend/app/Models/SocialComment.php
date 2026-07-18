<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A comment pulled back from the platform for a published target. */
class SocialComment extends Model
{
    protected $fillable = [
        'social_post_target_id', 'external_id', 'author_name', 'text', 'posted_at',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
    ];

    public function target(): BelongsTo
    {
        return $this->belongsTo(SocialPostTarget::class, 'social_post_target_id');
    }
}
