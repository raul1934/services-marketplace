<?php

namespace App\Listeners;

use App\Enums\RequestStatus;
use App\Events\RequestStatusUpdated;
use App\Models\ServiceRequest;
use App\Notifications\ActiveRequestSync;

/**
 * Keeps the customer's persistent "chamado em andamento" notification in sync
 * with the request, by pushing a silent data message on every status change.
 *
 * Hooked to the event rather than called from each service method on purpose.
 * It started as one notify() inside RequestService::updateStatus, which covers
 * only in_progress and completed — so with the app closed, accepting a bid or
 * cancelling left the tracker showing a stale status until the app was reopened.
 * Every transition (accept, cancel, no-show, requote, reschedule, surcharge,
 * expire, reopen, complete) already dispatches RequestStatusUpdated, so binding
 * here covers all of them and can't be forgotten by whoever adds the eleventh.
 */
class SyncActiveRequestNotification
{
    public function handle(RequestStatusUpdated $event): void
    {
        $status = RequestStatus::tryFrom($event->status);

        if (! $status) {
            return;
        }

        $request = ServiceRequest::with('client')->find($event->requestId);

        $request?->client?->notify(new ActiveRequestSync($request->id, $status));
    }
}
