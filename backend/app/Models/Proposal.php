<?php

namespace App\Models;

use App\Enums\ProposalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proposal extends Model
{
    protected $fillable = [
        'service_request_id', 'provider_id', 'price', 'eta_minutes', 'comment',
        'deposit_required', 'deposit_percentage', 'deposit_amount', 'status',
    ];

    protected $casts = [
        'status' => ProposalStatus::class,
        'price' => 'decimal:2',
        'eta_minutes' => 'integer',
        'deposit_required' => 'boolean',
        'deposit_percentage' => 'integer',
        'deposit_amount' => 'decimal:2',
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
