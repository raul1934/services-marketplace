<?php

namespace App\Models;

use App\Enums\PartAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobPart extends Model
{
    protected $fillable = ['service_request_id', 'name', 'action', 'quantity', 'unit_price'];

    protected $casts = [
        'action' => PartAction::class,
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }
}
