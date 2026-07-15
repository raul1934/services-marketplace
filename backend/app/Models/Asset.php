<?php

namespace App\Models;

use App\Enums\AssetType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * A client's registered asset (vehicle/property/pet). Requests link to one so
 * history consolidates on the asset over time ("Carfax do ativo" — R6). The
 * type-specific characteristics live in a typed `detailable` row.
 */
class Asset extends Model
{
    protected $fillable = ['user_id', 'type', 'nickname', 'detailable_type', 'detailable_id', 'photo_path', 'archived_at'];

    protected $casts = [
        'type' => AssetType::class,
        'archived_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // Hard-deleting an asset removes its typed detail (archive keeps everything).
        static::deleting(function (Asset $asset) {
            $asset->detailable?->delete();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The typed characteristics row (AssetVehicle/AssetProperty/AssetPet). */
    public function detailable(): MorphTo
    {
        return $this->morphTo();
    }

    /** Service requests tied to this asset (the consolidated history). */
    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    /** Append-only odometer readings (vehicles), newest first. */
    public function readings(): HasMany
    {
        return $this->hasMany(AssetReading::class)->latest('recorded_at');
    }

    /** Named, AR-measurable parts of a property (rooms/areas), in creation order. */
    public function parts(): HasMany
    {
        return $this->hasMany(AssetPart::class)->orderBy('id');
    }

    /** Not archived (sold/given away). */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }
}
