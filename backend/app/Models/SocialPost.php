<?php

namespace App\Models;

use App\Enums\SocialPostStatus;
use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * A composed post fanned out to one or more platforms (see targets()). The
 * optional image is a polymorphic Media with tag 'social'.
 */
class SocialPost extends Model
{
    use HasMedia;

    protected $fillable = [
        'caption', 'status', 'scheduled_at', 'created_by',
    ];

    protected $casts = [
        'status' => SocialPostStatus::class,
        'scheduled_at' => 'datetime',
    ];

    public function targets(): HasMany
    {
        return $this->hasMany(SocialPostTarget::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The single social image, if one was uploaded. */
    public function image(): MorphOne
    {
        return $this->morphOne(Media::class, 'mediable')->where('tag', 'social');
    }

    /** Public HTTPS URL of the image (Meta needs a reachable url), or null. */
    public function imageUrl(): ?string
    {
        return $this->image?->url;
    }
}
