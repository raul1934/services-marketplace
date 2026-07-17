<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // Nested like VehicleMakeResource's models: the whole catalog arrives
            // in one request and the client caches it for a day, so picking a
            // type and offering its parts costs no round trip.
            'part_types' => $this->whenLoaded('partTypes', fn () => $this->partTypes->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                // Pre-tick this one for this kind of place (an edícula's pool).
                'default_selected' => (bool) $p->pivot->default_selected,
            ])->values()),
        ];
    }
}
