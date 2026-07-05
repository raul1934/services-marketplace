<?php

namespace App\Services;

use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Events\ProposalReceived;
use App\Events\RequestStatusUpdated;
use App\Notifications\NewProposalForClient;
use App\Notifications\ProposalAccepted;
use App\Notifications\ProposalDeclined;
use App\Notifications\ProposalNotAccepted;
use Illuminate\Support\Facades\DB;

class ProposalService
{
    /**
     * Submit (or update) a provider's bid on an open request.
     *
     * @param  array{price:float,eta_minutes:int,comment?:?string,deposit_required?:?bool,deposit_percentage?:?int}  $data
     */
    public function submit(ServiceRequest $request, User $provider, array $data): Proposal
    {
        $depositRequired = (bool) ($data['deposit_required'] ?? false);
        $depositPercentage = $depositRequired ? ($data['deposit_percentage'] ?? null) : null;
        $depositAmount = $depositRequired && $depositPercentage !== null
            ? round((float) $data['price'] * $depositPercentage / 100, 2)
            : null;

        $proposal = Proposal::updateOrCreate(
            ['service_request_id' => $request->id, 'provider_id' => $provider->id],
            [
                'price' => $data['price'],
                'eta_minutes' => $data['eta_minutes'],
                'comment' => $data['comment'] ?? null,
                'deposit_required' => $depositRequired,
                'deposit_percentage' => $depositPercentage,
                'deposit_amount' => $depositAmount,
                'status' => ProposalStatus::Pending->value,
            ],
        );

        // Same signal whether this is a brand-new bid or the provider editing
        // a previous one (updateOrCreate above) — the client should see it either way.
        $request->client->notify(new NewProposalForClient(
            $request->id,
            $proposal->id,
            (float) $proposal->price,
            (int) $proposal->eta_minutes,
        ));

        ProposalReceived::dispatch($request->id, $proposal->id);

        return $proposal;
    }

    /** Provider withdraws their own pending bid. */
    public function withdraw(Proposal $proposal): void
    {
        $proposal->update(['status' => ProposalStatus::Withdrawn->value]);
    }

    /**
     * Customer explicitly dismisses one bid without accepting another. Distinct
     * from the silent Rejected status the losing bids get on accept() below —
     * this one is a deliberate customer action, so the provider is told.
     */
    public function decline(Proposal $proposal): void
    {
        $proposal->update(['status' => ProposalStatus::Declined->value]);
        $proposal->provider->notify(new ProposalDeclined($proposal->service_request_id));
    }

    /**
     * Accept a proposal: mark it accepted, reject the rest, and move the
     * request to `accepted` with the winning provider denormalized onto it.
     */
    public function accept(Proposal $proposal): ServiceRequest
    {
        [$request, $losingProviderIds] = DB::transaction(function () use ($proposal) {
            /** @var ServiceRequest $request */
            $request = ServiceRequest::whereKey($proposal->service_request_id)->lockForUpdate()->firstOrFail();

            $proposal->update(['status' => ProposalStatus::Accepted->value]);

            // Only still-Pending bids are "competing" — a bid the provider already
            // withdrew, or one the client already declined, keeps its own status
            // and doesn't need a "you lost" notification.
            $losing = Proposal::where('service_request_id', $request->id)
                ->where('id', '!=', $proposal->id)
                ->where('status', ProposalStatus::Pending->value)
                ->pluck('provider_id');

            Proposal::where('service_request_id', $request->id)
                ->where('id', '!=', $proposal->id)
                ->where('status', ProposalStatus::Pending->value)
                ->update(['status' => ProposalStatus::Rejected->value]);

            $request->update([
                'status' => RequestStatus::Accepted->value,
                'accepted_proposal_id' => $proposal->id,
                'accepted_provider_id' => $proposal->provider_id,
                'accepted_at' => now(),
                // Start-of-service code (C17/P14): only urgent jobs get one — the
                // customer reads it to the provider to confirm arrival on a help-now
                // job. Scheduled jobs start without a code.
                'start_code' => $request->urgency === RequestUrgency::Urgent
                    ? str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT)
                    : null,
            ]);

            return [$request->fresh(), $losing];
        });

        $proposal->provider->notify(new ProposalAccepted($request->id));

        foreach (User::whereIn('id', $losingProviderIds)->get() as $losingProvider) {
            $losingProvider->notify(new ProposalNotAccepted($request->id));
        }

        RequestStatusUpdated::dispatch($request->id, $request->status->value);

        return $request;
    }
}
