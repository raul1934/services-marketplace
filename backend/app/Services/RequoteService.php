<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\SurchargeStatus;
use App\Events\RequestStatusUpdated;
use App\Jobs\DispatchNewRequestToProviders;
use App\Models\ServiceRequest;

/**
 * Re-cotação (C40): when a surcharge passed ~50% of the combinado or the scope
 * became another service, the request is paused in `requote`. The client either
 * accepts the present provider's new quote (the pending surcharge folds in and
 * the job resumes), or reopens to others (job leaves the provider, republished
 * with the updated scope). Mirrors the present-provider-loses-pricing-power rule.
 */
class RequoteService
{
    /** Accept the present provider's new quote: approve pending surcharges, resume. */
    public function accept(ServiceRequest $request): ServiceRequest
    {
        $request->surcharges()
            ->where('status', SurchargeStatus::Pending->value)
            ->each(fn ($s) => $s->update([
                'status' => SurchargeStatus::Approved->value,
                'resolved_at' => now(),
            ]));

        $request->update(['status' => RequestStatus::InProgress->value]);
        RequestStatusUpdated::dispatch($request->id, RequestStatus::InProgress->value);

        return $request->fresh();
    }

    /**
     * Reopen to other providers with the updated scope: refuse pending surcharges,
     * detach the current provider, republish.
     */
    public function reopen(ServiceRequest $request, ?string $newDescription = null): ServiceRequest
    {
        $request->surcharges()
            ->where('status', SurchargeStatus::Pending->value)
            ->each(fn ($s) => $s->update([
                'status' => SurchargeStatus::Refused->value,
                'resolved_at' => now(),
            ]));

        $request->update([
            'status' => RequestStatus::Open->value,
            'accepted_proposal_id' => null,
            'accepted_provider_id' => null,
            'accepted_at' => null,
            'started_at' => null,
            'parts_approval_requested_at' => null,
            'parts_approved_at' => null,
            'description' => $newDescription ?: $request->description,
        ]);

        // Re-notify nearby providers with the updated scope.
        DispatchNewRequestToProviders::dispatch($request->id);
        RequestStatusUpdated::dispatch($request->id, RequestStatus::Open->value);

        return $request->fresh();
    }
}
