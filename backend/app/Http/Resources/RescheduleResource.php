<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RescheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requested_by_role' => $this->requested_by_role,
            'proposed_starts_at' => $this->proposed_starts_at,
            'proposed_ends_at' => $this->proposed_ends_at,
            'proposed_reception_type' => $this->proposed_reception_type,
            'reason' => $this->reason,
            'status' => $this->status,
            'late' => (bool) $this->late,
            'created_at' => $this->created_at,
            'resolved_at' => $this->resolved_at,
        ];
    }
}
