<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\RescheduleStatus;
use App\Events\RescheduleRequested as RescheduleRequestedEvent;
use App\Events\RescheduleResolved as RescheduleResolvedEvent;
use App\Events\RequestStatusUpdated;
use App\Jobs\DispatchNewRequestToProviders;
use App\Models\RescheduleRequest;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Notifications\RescheduleRequested as RescheduleRequestedNotification;
use App\Notifications\RescheduleResolved as RescheduleResolvedNotification;

/**
 * Bidirectional rescheduling on a scheduled job (R-AGENDA). Max 3 per job.
 * ≥24h antecedence is good-faith; <24h is no-show-grade (flagged `late` for the
 * back-office to apply the penalty). Also carries the reception-type inversion
 * (no local × oficina), same request/approve shape.
 */
class RescheduleService
{
    public const MAX_PER_JOB = 3;

    /**
     * @param  'client'|'provider'  $role
     * @param  array{proposed_starts_at?:?string,proposed_ends_at?:?string,proposed_reception_type?:?string,reason?:?string}  $data
     */
    public function request(ServiceRequest $request, User $actor, string $role, array $data): RescheduleRequest
    {
        abort_if(
            $request->rescheduleRequests()->count() >= self::MAX_PER_JOB,
            422,
            __('messages.reschedule_limit'),
        );

        // The client may only move a job that hasn't started. Urgent jobs also
        // wait out the promised arrival window — see ServiceRequest::canReschedule.
        // The provider's own reschedule requests aren't gated by that clock:
        // they're the party who knows they can't make it.
        abort_if($role === 'client' && ! $request->canReschedule(), 422, __('messages.request_not_active'));

        $reschedule = $request->rescheduleRequests()->create([
            'requested_by_id' => $actor->id,
            'requested_by_role' => $role,
            'proposed_starts_at' => $data['proposed_starts_at'] ?? null,
            'proposed_ends_at' => $data['proposed_ends_at'] ?? null,
            'proposed_reception_type' => $data['proposed_reception_type'] ?? null,
            'reason' => $data['reason'] ?? null,
            'status' => RescheduleStatus::Pending->value,
            'late' => $this->isLate($request),
        ]);

        $this->counterparty($request, $role)?->notify(
            new RescheduleRequestedNotification($request->id, $reschedule->id)
        );
        RescheduleRequestedEvent::dispatch($request->id, $reschedule->id, $role);

        return $reschedule;
    }

    /** The counter-party accepts: apply the proposed window / reception swap. */
    public function accept(RescheduleRequest $reschedule, User $actor): RescheduleRequest
    {
        $this->authorizeCounterparty($reschedule, $actor);
        $request = $reschedule->request;

        if ($reschedule->proposed_starts_at) {
            $request->availabilities()->delete();
            $request->availabilities()->create([
                'starts_at' => $reschedule->proposed_starts_at,
                'ends_at' => $reschedule->proposed_ends_at ?? $reschedule->proposed_starts_at,
            ]);
        }
        if ($reschedule->proposed_reception_type) {
            $request->update(['reception_type' => $reschedule->proposed_reception_type->value]);
        }

        return $this->resolve($reschedule, RescheduleStatus::Accepted);
    }

    /**
     * The counter-party declines. If a client's request is declined by the
     * provider, the job leaves the provider and reopens to others (R-AGENDA).
     */
    public function decline(RescheduleRequest $reschedule, User $actor): RescheduleRequest
    {
        $this->authorizeCounterparty($reschedule, $actor);

        $resolved = $this->resolve($reschedule, RescheduleStatus::Declined);

        if ($reschedule->requested_by_role === 'client') {
            $this->reopenToOthers($reschedule->request);
        }

        return $resolved;
    }

    private function resolve(RescheduleRequest $reschedule, RescheduleStatus $status): RescheduleRequest
    {
        $reschedule->update(['status' => $status->value, 'resolved_at' => now()]);

        $word = $status === RescheduleStatus::Accepted ? 'accepted' : 'declined';
        $reschedule->requestedBy->notify(
            new RescheduleResolvedNotification($reschedule->service_request_id, $reschedule->id, $word)
        );
        RescheduleResolvedEvent::dispatch($reschedule->service_request_id, $reschedule->id, $word);

        return $reschedule->fresh();
    }

    private function reopenToOthers(ServiceRequest $request): void
    {
        $request->update([
            'status' => RequestStatus::Open->value,
            'accepted_proposal_id' => null,
            'accepted_provider_id' => null,
            'accepted_at' => null,
        ]);
        DispatchNewRequestToProviders::dispatch($request->id);
        RequestStatusUpdated::dispatch($request->id, RequestStatus::Open->value);
    }

    /** <24h before the earliest scheduled window counts as no-show-grade. */
    private function isLate(ServiceRequest $request): bool
    {
        $first = $request->availabilities()->orderBy('starts_at')->first();

        return $first && $first->starts_at !== null
            && now()->diffInHours($first->starts_at, false) < 24;
    }

    private function counterparty(ServiceRequest $request, string $byRole): ?User
    {
        return $byRole === 'client' ? $request->provider : $request->client;
    }

    private function authorizeCounterparty(RescheduleRequest $reschedule, User $actor): void
    {
        abort_unless($reschedule->status === RescheduleStatus::Pending, 422, __('messages.reschedule_not_pending'));
        // Only the side that did NOT raise the request may resolve it.
        abort_if($reschedule->requested_by_id === $actor->id, 403);
    }
}
