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

        $request->client->notify(new NewProposalForClient(
            $request->id,
            $proposal->id,
            (float) $proposal->price,
            (int) $proposal->eta_minutes,
        ));

        ProposalReceived::dispatch($request->id, $proposal->id);

        return $proposal;
    }

    /**
     * Accept a proposal: mark it accepted, reject the rest, and move the
     * request to `accepted` with the winning provider denormalized onto it.
     */
    public function accept(Proposal $proposal): ServiceRequest
    {
        $request = DB::transaction(function () use ($proposal) {
            /** @var ServiceRequest $request */
            $request = ServiceRequest::whereKey($proposal->service_request_id)->lockForUpdate()->firstOrFail();

            $proposal->update(['status' => ProposalStatus::Accepted->value]);

            Proposal::where('service_request_id', $request->id)
                ->where('id', '!=', $proposal->id)
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

            return $request->fresh();
        });

        $proposal->provider->notify(new ProposalAccepted($request->id));

        RequestStatusUpdated::dispatch($request->id, $request->status->value);

        return $request;
    }
}
