<?php

namespace App\Models;

use App\Enums\PartAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobPart extends Model
{
    protected $fillable = ['service_request_id', 'name', 'action', 'quantity', 'unit_price', 'approved_at'];

    protected $casts = [
        'action' => PartAction::class,
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }
}
