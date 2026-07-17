<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/** A named part of a property asset with an optional AR measurement (R6). */
class AssetPart extends Model
{
    use HasMedia;

    protected $fillable = [
        'asset_id', 'name', 'area', 'perimeter', 'points_count', 'measured_at',
    ];

    protected $casts = [
        'area' => 'float',
        'perimeter' => 'float',
        'points_count' => 'integer',
        'measured_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /** Photos the owner took while measuring this part (media tagged `measurement`). */
    public function measurementPhotos(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('tag', 'measurement')->orderBy('position');
    }
}
