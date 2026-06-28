<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProviderProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'bio' => $this->bio,
            'vehicle_type' => $this->vehicle_type,
            'is_online' => (bool) $this->is_online,
            'is_approved' => (bool) $this->is_approved,
            'plan' => ($this->plan ?? \App\Enums\ProviderPlan::Free)->value,
            'commission_rate' => $this->commissionRate(),
            'plan_expires_at' => $this->plan_expires_at?->toDateString(),
            'coverage_radius_km' => (int) $this->coverage_radius_km,
            'insurance_valid_until' => $this->insurance_valid_until?->toDateString(),
            'insured' => $this->insurance_valid_until !== null && $this->insurance_valid_until->isFuture(),
            'availability_type' => $this->availability_type,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => (int) $this->rating_count,
            'jobs_completed' => (int) $this->jobs_completed,
        ];
    }
}
