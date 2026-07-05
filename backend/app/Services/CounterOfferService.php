<?php

namespace App\Services;

use App\Enums\CounterOfferStatus;
use App\Enums\ProposalStatus;
use App\Models\Proposal;
use App\Models\ProposalCounterOffer;
use App\Notifications\CounterOfferDeclined;
use App\Notifications\NewCounterOffer;
use App\Notifications\NewProposalForClient;

class CounterOfferService
{
    /**
     * Customer proposes a different price on a proposal. Reuses the existing
     * pending counter (if any) instead of stacking a new one — one live
     * counter per proposal at a time.
     */
    public function propose(Proposal $proposal, float $price, ?string $message): ProposalCounterOffer
    {
        $counter = ProposalCounterOffer::updateOrCreate(
            ['proposal_id' => $proposal->id, 'status' => CounterOfferStatus::Pending->value],
            [
                'service_request_id' => $proposal->service_request_id,
                'price' => $price,
                'message' => $message,
            ],
        );

        $proposal->provider->notify(new NewCounterOffer($proposal->service_request_id, $price));

        return $counter;
    }

    /** Provider accepts: their proposal updates to the countered price. */
    public function accept(ProposalCounterOffer $counter): Proposal
    {
        $proposal = $counter->proposal;

        $proposal->update(['price' => $counter->price, 'status' => ProposalStatus::Pending->value]);
        $counter->update(['status' => CounterOfferStatus::Accepted->value, 'resolved_at' => now()]);

        $proposal->request->client->notify(new NewProposalForClient(
            $proposal->service_request_id,
            $proposal->id,
            (float) $proposal->price,
            (int) $proposal->eta_minutes,
        ));

        return $proposal->fresh();
    }

    /** Provider declines: the original proposal price stands. */
    public function decline(ProposalCounterOffer $counter): void
    {
        $counter->update(['status' => CounterOfferStatus::Declined->value, 'resolved_at' => now()]);
        $counter->request->client->notify(new CounterOfferDeclined($counter->service_request_id));
    }
}
