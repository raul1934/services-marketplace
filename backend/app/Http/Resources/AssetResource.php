<?php

namespace App\Http\Resources;

use App\Enums\AssetType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'nickname' => $this->nickname,
            'photo_url' => $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null,
            'archived' => $this->archived_at !== null,
            'created_at' => $this->created_at,
            // Typed per-type characteristics (the polymorphic detail).
            'detail' => $this->whenLoaded('detailable', fn () => $this->detailResource()),
        ];
    }

    private function detailResource(): ?JsonResource
    {
        if ($this->detailable === null) {
            return null;
        }

        return match ($this->type) {
            AssetType::Vehicle => new AssetVehicleResource($this->detailable),
            AssetType::Property => new AssetPropertyResource($this->detailable),
            AssetType::Pet => new AssetPetResource($this->detailable),
        };
    }
}
