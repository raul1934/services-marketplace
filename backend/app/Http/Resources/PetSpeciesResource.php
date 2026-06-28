<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PetSpeciesResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'breeds' => $this->whenLoaded('breeds', fn () => $this->breeds->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
            ])->values()),
        ];
    }
}
