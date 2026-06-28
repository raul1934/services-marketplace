<?php

namespace App\Models\Concerns;

use App\Models\Media;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/** Attaches a polymorphic media collection to a model. */
trait HasMedia
{
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->orderBy('position');
    }

    /** @param  string|array<string>  $tag */
    public function mediaByTag(string|array $tag): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->whereIn('tag', (array) $tag)->orderBy('position');
    }
}
