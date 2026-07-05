<?php

namespace App\Models;

use App\Enums\AvailabilityType;
use App\Enums\ProviderPlan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ProviderProfile extends Model
{
    protected $fillable = [
        'user_id', 'market_id', 'is_online', 'availability_type', 'company_name', 'bio',
        'vehicle_type', 'is_approved', 'plan', 'plan_expires_at', 'coverage_radius_km', 'insurance_valid_until',
        'rating_avg', 'rating_count', 'jobs_completed', 'last_online_at', 'no_show_count',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'is_approved' => 'boolean',
        'plan' => ProviderPlan::class,
        'plan_expires_at' => 'datetime',
        'coverage_radius_km' => 'integer',
        'insurance_valid_until' => 'date',
        'availability_type' => AvailabilityType::class,
        'rating_avg' => 'decimal:2',
        'rating_count' => 'integer',
        'jobs_completed' => 'integer',
        'last_online_at' => 'datetime',
        'no_show_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function market(): BelongsTo
    {
        return $this->belongsTo(Market::class);
    }

    /** This provider's verification documents (ProviderDocument belongs to User, not ProviderProfile directly). */
    public function documents(): HasManyThrough
    {
        return $this->hasManyThrough(ProviderDocument::class, User::class, 'id', 'user_id', 'user_id', 'id');
    }

    /** Per-job platform commission for this provider's plan (defaults to Free). */
    public function commissionRate(): float
    {
        return ($this->plan ?? ProviderPlan::Free)->commissionRate();
    }
}
