<?php

namespace App\Bots\Observers;

use App\Bots\BotGate;
use App\Bots\Jobs\AcceptProposalAsBot;
use App\Enums\RequestStatus;
use App\Models\Proposal;

/**
 * TEMPORARY — test bots. A bot client accepts a real provider's bid, so the
 * provider isn't left holding a job that nobody on the other side will ever
 * answer.
 */
class BotProposalObserver
{
    public function created(Proposal $proposal): void
    {
        if (! BotGate::autoAdvance()) {
            return;
        }

        // Only a REAL provider's bid on a BOT client's request. A bot bidding
        // on a bot request would be a closed loop with no test value.
        if ($proposal->provider?->is_bot) {
            return;
        }

        $request = $proposal->request;

        if (! $request?->client?->is_bot || $request->status !== RequestStatus::Open) {
            return;
        }

        // Deliberately delayed: accepting the instant the bid lands reads as
        // robotic and skips the "aguardando resposta do cliente" state the
        // provider app is meant to show.
        AcceptProposalAsBot::dispatch($proposal->id)
            ->delay(now()->addSeconds((int) config('bots.accept_delay_seconds', 45)));
    }
}
