<?php

namespace App\Models;

use App\Enums\CounterOfferStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A customer's counter-price on a specific proposal. One pending counter per
 * proposal at a time (enforced in ProposalService, not the schema) — a fresh
 * counter reuses/replaces the existing pending row instead of stacking them.
 */
class ProposalCounterOffer extends Model
{
    protected $fillable = ['proposal_id', 'service_request_id', 'price', 'message', 'status', 'resolved_at'];

    protected $casts = [
        'price' => 'decimal:2',
        'status' => CounterOfferStatus::class,
        'resolved_at' => 'datetime',
    ];

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }
}
