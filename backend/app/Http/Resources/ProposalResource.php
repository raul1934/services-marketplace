<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProposalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $provider = $this->whenLoaded('provider');
        $profile = $this->provider?->providerProfile;

        return [
            'id' => $this->id,
            'service_request_id' => $this->service_request_id,
            'provider_id' => $this->provider_id,
            'price' => (float) $this->price,
            'eta_minutes' => (int) $this->eta_minutes,
            'comment' => $this->comment,
            'deposit_required' => (bool) $this->deposit_required,
            'deposit_percentage' => $this->deposit_percentage !== null ? (int) $this->deposit_percentage : null,
            'deposit_amount' => $this->deposit_amount !== null ? (float) $this->deposit_amount : null,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'provider_name' => $this->when($provider !== null, fn () => $this->provider->name),
            'provider_rating_avg' => $this->when($profile !== null, fn () => (float) $profile->rating_avg),
            'provider_rating_count' => $this->when($profile !== null, fn () => (int) $profile->rating_count),
            // "Com seguro" badge — the pro has active liability coverage (opt-in).
            'provider_insured' => $this->when(
                $profile !== null,
                fn () => $profile->insurance_valid_until !== null && $profile->insurance_valid_until->isFuture(),
            ),
        ];
    }
}
