<?php

namespace App\Models;

use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A surcharge (acréscimo) proposed by the provider on an active job. The % is
 * measured over the original combinado, accumulated (R-ACRÉSCIMO). Photos are
 * stored as an array of disk paths (a reason photo is mandatory on submit).
 */
class Surcharge extends Model
{
    use HasMedia;

    protected $fillable = [
        'service_request_id', 'provider_id', 'amount', 'reason',
        'percent_accumulated', 'tier', 'status', 'resolved_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percent_accumulated' => 'decimal:2',
        'tier' => SurchargeTier::class,
        'status' => SurchargeStatus::class,
        'resolved_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }
}
