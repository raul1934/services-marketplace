<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One odometer reading in an asset's append-only mileage history (R6). */
class AssetReading extends Model
{
    protected $fillable = [
        'asset_id', 'service_request_id', 'mileage', 'recorded_at', 'note', 'recorded_by_id', 'source',
    ];

    protected $casts = [
        'mileage' => 'integer',
        'recorded_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }
}
