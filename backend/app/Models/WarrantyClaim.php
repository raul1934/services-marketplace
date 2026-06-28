<?php

namespace App\Models;

use App\Enums\WarrantyStatus;
use App\Enums\WarrantyType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A warranty claim (garantia): covers redo/refund up to the service value within
 * the deadline window (R-ACRÉSCIMO: garantia is the judge of unnecessary
 * service/part). Redo assigns a new provider at no cost to the client.
 */
class WarrantyClaim extends Model
{
    protected $fillable = [
        'service_request_id', 'client_id', 'type', 'status', 'description', 'deadline_at', 'resolved_at',
    ];

    protected $casts = [
        'type' => WarrantyType::class,
        'status' => WarrantyStatus::class,
        'deadline_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
