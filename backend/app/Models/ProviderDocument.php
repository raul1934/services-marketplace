<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProviderDocument extends Model
{
    protected $fillable = ['user_id', 'type', 'disk', 'path', 'status'];

    protected $appends = ['url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk($this->disk ?? 'public')->url($this->path) : null;
    }
}
