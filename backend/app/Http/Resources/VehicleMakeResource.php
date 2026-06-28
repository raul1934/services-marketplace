<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleMakeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo_url' => $this->logo_url, // model accessor (handles CDN URL vs disk path)
            'models' => $this->whenLoaded('models', fn () => $this->models->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
            ])->values()),
        ];
    }
}
