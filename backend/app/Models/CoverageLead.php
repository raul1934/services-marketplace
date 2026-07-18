<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Demand from outside every Market's geofence — see RequestService::create(). */
class CoverageLead extends Model
{
    protected $fillable = ['client_id', 'service_category_id', 'latitude', 'longitude', 'address'];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }
}
