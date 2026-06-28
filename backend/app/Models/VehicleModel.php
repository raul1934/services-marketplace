<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A seeded vehicle model, belonging to a make. */
class VehicleModel extends Model
{
    protected $fillable = ['vehicle_make_id', 'name'];

    public function make(): BelongsTo
    {
        return $this->belongsTo(VehicleMake::class, 'vehicle_make_id');
    }
}
