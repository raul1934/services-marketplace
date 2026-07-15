<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A named part of a property asset with an optional AR measurement (R6). */
class AssetPart extends Model
{
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
}
