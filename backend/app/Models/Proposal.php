<?php

namespace App\Models;

use App\Enums\ProposalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Proposal extends Model
{
    protected $fillable = [
        'service_request_id', 'provider_id', 'price', 'eta_minutes', 'comment',
        'deposit_required', 'deposit_percentage', 'deposit_amount', 'status',
        'is_test', // TEMP — test bots. Remove with app/Bots.
    ];

    protected $casts = [
        'status' => ProposalStatus::class,
        'is_test' => 'boolean', // TEMP — test bots. Remove with app/Bots.
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

    public function counterOffers(): HasMany
    {
        return $this->hasMany(ProposalCounterOffer::class, 'proposal_id');
    }
}
