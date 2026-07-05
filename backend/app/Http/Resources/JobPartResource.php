<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobPartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'action' => $this->action,
            'quantity' => (int) $this->quantity,
            'unit_price' => $this->unit_price !== null ? (float) $this->unit_price : null,
            'approved_at' => $this->approved_at,
        ];
    }
}
