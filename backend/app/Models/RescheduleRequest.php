<?php

namespace App\Models;

use App\Enums\ReceptionType;
use App\Enums\RescheduleStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A reschedule request raised by either party on a scheduled job (R-AGENDA).
 * Carries a proposed time window and/or a proposed reception-type inversion
 * (no local × oficina). `late` marks <24h antecedence (no-show-grade).
 */
class RescheduleRequest extends Model
{
    protected $fillable = [
        'service_request_id', 'requested_by_id', 'requested_by_role',
        'proposed_starts_at', 'proposed_ends_at', 'proposed_reception_type',
        'reason', 'status', 'late', 'resolved_at',
    ];

    protected $casts = [
        'proposed_starts_at' => 'datetime',
        'proposed_ends_at' => 'datetime',
        'proposed_reception_type' => ReceptionType::class,
        'status' => RescheduleStatus::class,
        'late' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }
}
