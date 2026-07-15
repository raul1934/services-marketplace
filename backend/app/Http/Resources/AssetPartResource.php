<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetPartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'area' => $this->area,
            'perimeter' => $this->perimeter,
            'points_count' => $this->points_count,
            'measured_at' => $this->measured_at,
        ];
    }
}
