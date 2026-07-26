<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The execution of a visit to a site within a shift (tied to the route being
 * run). A site's "running" state, and a route stop's now/next/done + "Nx this
 * shift", are derived from these.
 */
class FieldSitePerformance extends Model
{
    protected $fillable = ['shift_id', 'route_performance_id', 'site_id', 'status', 'crew', 'time', 'photo_before', 'photo_after', 'started_at', 'ended_at'];

    protected $casts = [
        'crew' => 'integer',
        'photo_before' => 'array',
        'photo_after' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function shift(): BelongsTo
    {
        return $this->belongsTo(FieldShift::class, 'shift_id');
    }

    public function routePerformance(): BelongsTo
    {
        return $this->belongsTo(FieldRoutePerformance::class, 'route_performance_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(FieldSite::class, 'site_id');
    }

    public function servicePerformances(): HasMany
    {
        return $this->hasMany(FieldServicePerformance::class, 'site_performance_id');
    }
}
