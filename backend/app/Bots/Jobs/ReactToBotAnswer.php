<?php

namespace App\Bots\Jobs;

use App\Bots\BotGate;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\RequestQuestion;
use App\Services\ProposalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * TEMPORARY — test bots. The bot's reply after the client answers its question.
 *
 * Two possible reactions, coin-flipped, both of which a real provider would
 * plausibly do: ask one follow-up, or revise the bid now that they know more.
 *
 * On the revision path the re-notification from ProposalService::submit() is
 * the desired signal — unlike in SubmitBotBid, where it had to be suppressed.
 */
class ReactToBotAnswer implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const MAX_BOT_QUESTIONS = 2;

    public function __construct(public int $questionId) {}

    public function handle(ProposalService $proposals): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        $question = RequestQuestion::with(['request', 'provider'])->find($this->questionId);

        if (! $question || ! $question->provider?->is_bot || $question->answered_at === null) {
            return;
        }

        $request = $question->request;

        if (! $request || $request->status !== RequestStatus::Open) {
            return;
        }

        $proposal = Proposal::where('service_request_id', $request->id)
            ->where('provider_id', $question->provider_id)
            ->where('status', ProposalStatus::Pending->value)
            ->first();

        if (! $proposal) {
            return;
        }

        $asked = $request->questions()->where('provider_id', $question->provider_id)->count();
        $canAskAgain = $asked < self::MAX_BOT_QUESTIONS;

        if ($canAskAgain && random_int(0, 1) === 0) {
            AskBotQuestion::dispatch($proposal->id);

            return;
        }

        $this->revisePrice($proposals, $proposal);
    }

    /** Nudge the bid ±15% and tell the client why, so the change reads as deliberate. */
    private function revisePrice(ProposalService $proposals, Proposal $proposal): void
    {
        $factor = random_int(85, 115) / 100;
        $price = max(1.0, round((float) $proposal->price * $factor, 2));

        $revised = $proposals->submit($proposal->request, $proposal->provider, [
            'price' => $price,
            'eta_minutes' => (int) $proposal->eta_minutes,
            'comment' => BotGate::label('Ajustei o valor com base na sua resposta.'),
        ]);

        $revised->forceFill(['is_test' => true])->save();
    }
}
