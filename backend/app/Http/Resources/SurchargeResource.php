<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SurchargeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'reason' => $this->reason,
            'percent_accumulated' => (float) $this->percent_accumulated,
            'tier' => $this->tier,
            'status' => $this->status,
            'photos' => $this->relationLoaded('media')
                ? $this->media->map(fn ($m) => $m->url)->values()
                : [],
            'provider' => $this->whenLoaded('provider', fn () => [
                'id' => $this->provider->id,
                'name' => $this->provider->name,
            ]),
            'created_at' => $this->created_at,
            'resolved_at' => $this->resolved_at,
        ];
    }
}
