<?php

namespace App\Models;

use App\Enums\DisputeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A dispute opened on a job. Two-sided (R5): the client states the claim and the
 * provider files a defense; both feed the back-office mediation. The provider's
 * split stays retained while the dispute is open (R-SPLIT).
 */
class Dispute extends Model
{
    protected $fillable = [
        'service_request_id', 'opened_by_id', 'claim', 'status', 'resolution', 'resolved_at',
    ];

    protected $casts = [
        'status' => DisputeStatus::class,
        'resolved_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(DisputeEvidence::class);
    }
}
