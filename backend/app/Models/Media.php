<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * A single image. Polymorphic: `mediable` is the owning record (a request,
 * surcharge, dispute evidence, job update…), or null while the upload is an
 * orphan waiting to be attached. `tag` distinguishes the role on its owner.
 */
class Media extends Model
{
    protected $table = 'media';

    protected $fillable = ['mediable_type', 'mediable_id', 'uploaded_by_id', 'disk', 'path', 'tag', 'position'];

    protected $appends = ['url'];

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk ?? 'public')->url($this->path);
    }
}
