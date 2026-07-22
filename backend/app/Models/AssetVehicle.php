<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/** Vehicle characteristics for an asset (the `detailable` of a vehicle asset). */
class AssetVehicle extends Model
{
    protected $fillable = [
        'kind', 'vehicle_make_id', 'vehicle_model_id', 'plate', 'color', 'year', 'current_mileage', 'fuel', 'chassis',
    ];

    protected $casts = [
        'current_mileage' => 'integer',
    ];

    public function asset(): MorphOne
    {
        return $this->morphOne(Asset::class, 'detailable');
    }

    public function make(): BelongsTo
    {
        return $this->belongsTo(VehicleMake::class, 'vehicle_make_id');
    }

    public function model(): BelongsTo
    {
        return $this->belongsTo(VehicleModel::class, 'vehicle_model_id');
    }
}
