<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/** Property characteristics for an asset (the `detailable` of a property asset). */
class AssetProperty extends Model
{
    protected $fillable = [
        'property_type_id', 'unit', 'size', 'address', 'floor', 'condo', 'latitude', 'longitude', 'geofence',
        'cep', 'street', 'number', 'neighborhood', 'city', 'state',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'geofence' => 'array',
    ];

    public function asset(): MorphOne
    {
        return $this->morphOne(Asset::class, 'detailable');
    }

    public function propertyType(): BelongsTo
    {
        return $this->belongsTo(PropertyType::class);
    }
}
