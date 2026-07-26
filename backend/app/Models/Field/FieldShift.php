<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The operational root: a tech's working day. The leader opens a shift whose
 * `shift_leader_id` equals its own id (the master). Each crew member added gets
 * their own shift row whose `shift_leader_id` points at the master. The day's
 * route/site performances hang off a shift.
 */
class FieldShift extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'shift_leader_id', 'tech', 'date', 'status', 'started_at', 'ended_at'];

    protected $casts = [
        'date' => 'date',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /** True when this shift opened itself — the team's master shift. */
    public function isMaster(): bool
    {
        return $this->shift_leader_id === $this->id;
    }

    /** The master shift this one belongs to (itself, if master). */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(self::class, 'shift_leader_id');
    }

    /** The crew members' shifts opened under this master (excludes itself). */
    public function crew(): HasMany
    {
        return $this->hasMany(self::class, 'shift_leader_id')
            ->whereColumn('id', '!=', 'shift_leader_id');
    }

    public function routePerformances(): HasMany
    {
        return $this->hasMany(FieldRoutePerformance::class, 'shift_id');
    }

    public function sitePerformances(): HasMany
    {
        return $this->hasMany(FieldSitePerformance::class, 'shift_id');
    }

    /** The single open master shift, if any (the prototype's "current" shift). */
    public static function active(): ?self
    {
        return static::query()
            ->where('status', 'active')
            ->whereColumn('id', 'shift_leader_id')
            ->first();
    }
}
