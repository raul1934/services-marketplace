<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetPropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'property_type_id' => $this->property_type_id,
            'kind' => $this->propertyType?->name, // resolved name for display
            'unit' => $this->unit,
            'size' => $this->size,
            'address' => $this->address,
            'cep' => $this->cep,
            'street' => $this->street,
            'number' => $this->number,
            'neighborhood' => $this->neighborhood,
            'city' => $this->city,
            'state' => $this->state,
            'floor' => $this->floor,
            'condo' => $this->condo,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'geofence' => $this->geofence,
        ];
    }
}
