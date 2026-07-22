<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetVehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'vehicle_make_id' => $this->vehicle_make_id,
            'vehicle_model_id' => $this->vehicle_model_id,
            // Resolved names (from the catalog) for display.
            'make' => $this->make?->name,
            'model' => $this->model?->name,
            'make_logo_url' => $this->make?->logo_url,
            'kind' => $this->kind,
            'plate' => $this->plate,
            'color' => $this->color,
            'year' => $this->year,
            'current_mileage' => $this->current_mileage,
            'fuel' => $this->fuel,
            'chassis' => $this->chassis,
        ];
    }
}
