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
        // Notes are owner-only. This resource is reused inside
        // ServiceRequestResource (providers see a request's asset), so emitting
        // notes unconditionally would leak the private note to providers.
        $isOwner = $request->user()?->id === $this->user_id;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'nickname' => $this->nickname,
            'photo_url' => $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null,
            'archived' => $this->archived_at !== null,
            'private_note' => $this->when($isOwner, fn () => $this->private_note),
            'provider_note' => $this->when($isOwner, fn () => $this->provider_note),
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
