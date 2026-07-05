<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A city the platform operates in, bounded by a polygon geofence (3+
 * {latitude, longitude} points, same shape as AssetProperty's geofence) —
 * see MatchingService::marketFor() for the point-in-polygon match.
 */
class Market extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'geofence', 'is_active'];

    protected $casts = [
        'geofence' => 'array',
        'is_active' => 'boolean',
    ];

    /** Market Admins assigned to this market. */
    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'admin_market');
    }

    public function providerProfiles(): HasMany
    {
        return $this->hasMany(ProviderProfile::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    /** Active markets a user can see — all of them for a Super Admin, only assigned ones for a Market Admin. */
    public static function activeInScope(User $user): Builder
    {
        return static::query()
            ->where('is_active', true)
            ->when(! $user->isSuperAdmin(), fn (Builder $q) => $q->whereIn('id', $user->marketIds()));
    }

    /** Average of the geofence's vertices — used to center the map on this market. */
    public function centroid(): ?array
    {
        $points = $this->geofence ?? [];
        if (count($points) === 0) {
            return null;
        }

        return [
            'latitude' => collect($points)->avg('latitude'),
            'longitude' => collect($points)->avg('longitude'),
        ];
    }
}
