<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetReadingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mileage' => $this->mileage,
            'recorded_at' => $this->recorded_at,
            'note' => $this->note,
            'source' => $this->source, // customer | provider
            'service_request_id' => $this->service_request_id,
        ];
    }
}
