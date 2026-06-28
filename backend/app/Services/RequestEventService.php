<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\SurchargeTier;
use App\Models\ServiceRequest;
use BackedEnum;
use DateTimeInterface;

/**
 * Builds a chronological (oldest → newest) feed of typed events for a request,
 * derived entirely from existing timestamps + relations — there is no event-log
 * table, this is a pure read-model. Each event is shaped as:
 *
 *   ['id' => string, 'type' => string, 'at' => ISO-8601, 'amount'? => float, 'data'? => array]
 *
 * Single place to extend with new event types; a provider-facing variant would
 * differ only in which events it includes.
 */
class RequestEventService
{
    /**
     * Lifecycle order, used only to break ties when two events share the same
     * (second-precision) timestamp — e.g. a request and its first proposal land
     * in the same second; the request must still come first.
     */
    private const ORDER = [
        'request_created' => 0,
        'proposal_received' => 1,
        'proposal_accepted' => 2,
        'reschedule_requested' => 3,
        'reschedule_resolved' => 4,
        'job_started' => 5,
        'parts_approval_requested' => 6,
        'part_added' => 7,
        'parts_approved' => 8,
        'surcharge_proposed' => 9,
        'requote' => 9,
        'surcharge_resolved' => 10,
        'job_update' => 11,
        'disputed' => 12,
        'job_completed' => 13,
        'no_show' => 14,
        'cancelled' => 15,
        'expired' => 16,
        'review_submitted' => 17,
    ];

    /** @return array<int, array<string, mixed>> */
    public function for(ServiceRequest $request): array
    {
        $request->loadMissing([
            'proposals.provider', 'acceptedProposal', 'provider',
            'surcharges', 'jobParts', 'rescheduleRequests', 'jobUpdates', 'review', 'disputes',
        ]);

        $events = [];
        $push = function (string $id, string $type, $at, array $extra = []) use (&$events): void {
            $iso = $this->iso($at);
            if ($iso === null) {
                return; // no source timestamp → the event hasn't happened
            }
            $events[] = array_merge(['id' => $id, 'type' => $type, 'at' => $iso, '_ord' => self::ORDER[$type] ?? 99], $extra);
        };

        $push("request:{$request->id}", 'request_created', $request->created_at);

        foreach ($request->proposals as $p) {
            $push("proposal:{$p->id}", 'proposal_received', $p->created_at, [
                'amount' => (float) $p->price,
                'data' => ['provider_name' => $p->provider?->name, 'eta_minutes' => $p->eta_minutes],
            ]);
        }

        if ($request->acceptedProposal) {
            $push("accepted:{$request->id}", 'proposal_accepted', $request->accepted_at, [
                'amount' => (float) $request->acceptedProposal->price,
                'data' => ['provider_name' => $request->provider?->name],
            ]);
        }

        $push("started:{$request->id}", 'job_started', $request->started_at);
        $push("parts_req:{$request->id}", 'parts_approval_requested', $request->parts_approval_requested_at);
        $push("parts_ok:{$request->id}", 'parts_approved', $request->parts_approved_at);

        foreach ($request->jobParts as $part) {
            $push("part:{$part->id}", 'part_added', $part->created_at, [
                'amount' => $part->unit_price !== null ? round((float) $part->unit_price * $part->quantity, 2) : null,
                'data' => ['name' => $part->name, 'quantity' => $part->quantity, 'action' => $this->enum($part->action)],
            ]);
        }

        foreach ($request->surcharges as $s) {
            $isRequote = $this->enum($s->tier) === SurchargeTier::Requote->value;
            $push("surcharge:{$s->id}", $isRequote ? 'requote' : 'surcharge_proposed', $s->created_at, [
                'amount' => (float) $s->amount,
                'data' => ['reason' => $s->reason, 'tier' => $this->enum($s->tier)],
            ]);
            $push("surcharge_res:{$s->id}", 'surcharge_resolved', $s->resolved_at, [
                'amount' => (float) $s->amount,
                'data' => ['status' => $this->enum($s->status), 'reason' => $s->reason],
            ]);
        }

        foreach ($request->rescheduleRequests as $r) {
            $push("resch:{$r->id}", 'reschedule_requested', $r->created_at, [
                'data' => ['by_role' => $r->requested_by_role, 'proposed_starts_at' => $this->iso($r->proposed_starts_at)],
            ]);
            $push("resch_res:{$r->id}", 'reschedule_resolved', $r->resolved_at, [
                'data' => ['status' => $this->enum($r->status)],
            ]);
        }

        foreach ($request->jobUpdates as $u) {
            $push("update:{$u->id}", 'job_update', $u->created_at, [
                'data' => ['body' => $u->body, 'photo_url' => $u->photo_url],
            ]);
        }

        foreach ($request->disputes as $d) {
            $push("dispute:{$d->id}", 'disputed', $d->created_at, [
                'data' => ['status' => $this->enum($d->status)],
            ]);
        }

        $push("completed:{$request->id}", 'job_completed', $request->completed_at);
        $push("cancelled:{$request->id}", 'cancelled', $request->cancelled_at, [
            'data' => ['reason' => $request->cancelled_reason],
        ]);
        $push("noshow:{$request->id}", 'no_show', $request->no_show_at, [
            'data' => ['reason' => $request->no_show_reason],
        ]);

        if ($request->status === RequestStatus::Expired) {
            $push("expired:{$request->id}", 'expired', $request->updated_at);
        }

        if ($request->review) {
            $push("review:{$request->review->id}", 'review_submitted', $request->review->created_at, [
                'data' => ['rating' => $request->review->rating],
            ]);
        }

        // Ascending by time, then lifecycle order, then id — deterministic even
        // when timestamps tie at second precision. The sort key is internal.
        usort($events, fn ($a, $b) => [$a['at'], $a['_ord'], $a['id']] <=> [$b['at'], $b['_ord'], $b['id']]);

        return array_map(function (array $e) {
            unset($e['_ord']);

            return $e;
        }, $events);
    }

    private function iso($value): ?string
    {
        if (! $value) {
            return null;
        }

        return $value instanceof DateTimeInterface ? $value->toIso8601String() : (string) $value;
    }

    private function enum($value): mixed
    {
        return $value instanceof BackedEnum ? $value->value : $value;
    }
}
