<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobUpdate extends Model
{
    use HasMedia;

    protected $fillable = ['service_request_id', 'user_id', 'body'];

    protected $appends = ['photo_url'];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** First attached photo (media tagged `update`), if any. */
    public function getPhotoUrlAttribute(): ?string
    {
        $media = $this->relationLoaded('media')
            ? $this->media->firstWhere('tag', 'update')
            : $this->media()->where('tag', 'update')->first();

        return $media?->url;
    }
}
