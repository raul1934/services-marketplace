<?php

namespace App\Bots\Jobs;

use App\Bots\BotGate;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Services\ProposalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * TEMPORARY — test bots. The bot client accepts a real provider's bid.
 *
 * ProposalService::accept() is already transactional with lockForUpdate, so a
 * race with a second bid arriving at the same moment resolves safely: the
 * status re-check below plus that lock mean only one bid can win.
 */
class AcceptProposalAsBot implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $proposalId) {}

    public function handle(ProposalService $proposals): void
    {
        if (! BotGate::autoAdvance()) {
            return;
        }

        $proposal = Proposal::with(['request.client', 'provider'])->find($this->proposalId);

        if (! $proposal || $proposal->status !== ProposalStatus::Pending) {
            return;
        }

        $request = $proposal->request;

        // Re-check everything: this ran ~45s after the observer, and the request
        // may have been accepted, cancelled or expired in the meantime.
        if (! $request?->client?->is_bot || $request->status !== RequestStatus::Open) {
            return;
        }

        $proposals->accept($proposal);
    }
}
