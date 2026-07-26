<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** The execution of a route within a shift — this is where "running" lives. */
class FieldRoutePerformance extends Model
{
    protected $fillable = ['shift_id', 'route_id', 'status', 'started_at', 'ended_at'];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function shift(): BelongsTo
    {
        return $this->belongsTo(FieldShift::class, 'shift_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(FieldRoute::class, 'route_id');
    }

    public function sitePerformances(): HasMany
    {
        return $this->hasMany(FieldSitePerformance::class, 'route_performance_id');
    }
}
