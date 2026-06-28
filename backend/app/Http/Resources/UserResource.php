<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_client' => (bool) $this->is_client,
            'is_provider' => (bool) $this->is_provider,
            'is_admin' => (bool) $this->is_admin,
            'avatar_url' => $this->avatar_path ? asset('storage/'.$this->avatar_path) : null,
            'provider_profile' => $this->when(
                $this->relationLoaded('providerProfile') && $this->providerProfile !== null,
                fn () => new ProviderProfileResource($this->providerProfile)
            ),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
        ];
    }
}
