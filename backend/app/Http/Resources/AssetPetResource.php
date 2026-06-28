<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetPetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'pet_species_id' => $this->pet_species_id,
            'pet_breed_id' => $this->pet_breed_id,
            'species' => $this->species?->name, // resolved names for display
            'breed' => $this->breed?->name,
            'size' => $this->size,
            'birthdate' => $this->birthdate,
            'weight' => $this->weight,
            'vaccines' => $this->vaccines,
            'microchip' => $this->microchip,
        ];
    }
}
