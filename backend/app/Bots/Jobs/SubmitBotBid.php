<?php

namespace App\Bots\Jobs;

use App\Bots\BotGate;
use App\Enums\RequestStatus;
use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\MatchingService;
use App\Services\ProposalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * TEMPORARY — test bots. One bot provider places one bid.
 *
 * Calls ProposalService::submit() in-process so the bid inherits the real
 * notification + broadcast side effects — the customer app cannot tell the
 * difference apart from the [TESTE] marking.
 */
class SubmitBotBid implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Unique lock lifetime: comfortably longer than the longest bid delay. */
    public int $uniqueFor = 300;

    public function __construct(public int $requestId, public int $providerId) {}

    public function uniqueId(): string
    {
        return "bot-bid:{$this->requestId}:{$this->providerId}";
    }

    public function handle(ProposalService $proposals, MatchingService $matching): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        $request = ServiceRequest::find($this->requestId);
        $provider = User::find($this->providerId);

        if (! $request || ! $provider?->is_bot || $request->status !== RequestStatus::Open) {
            return;
        }

        // ProposalService::submit() notifies the client on EVERY call — it does
        // not distinguish a new bid from an edit. updateOrCreate keeps the row
        // unique, but a queue retry would still push a second "novo lance" to a
        // real customer. So bail explicitly if this bot already bid.
        $exists = Proposal::where('service_request_id', $request->id)
            ->where('provider_id', $provider->id)
            ->exists();

        if ($exists) {
            return;
        }

        $proposal = $proposals->submit($request, $provider, [
            'price' => $this->price($request, $matching),
            'eta_minutes' => random_int(15, 90),
            'comment' => BotGate::label($this->comment()),
        ]);

        $proposal->forceFill(['is_test' => true])->save();

        // Ask the client something only AFTER the bid exists: the customer-side
        // QuestionController hides (and refuses to answer) questions from any
        // provider without a live proposal, so the reverse order would leave a
        // question that is invisible and unanswerable.
        AskBotQuestion::dispatch($proposal->id)->delay(now()->addSeconds(random_int(5, 15)));
    }

    /**
     * A plausible price: anchored on the client's stated budget when there is
     * one, else on what the category actually goes for nearby, else a spread
     * wide enough to make the proposals list worth sorting.
     */
    private function price(ServiceRequest $request, MatchingService $matching): float
    {
        $anchor = $request->budget_max !== null
            ? (float) $request->budget_max
            : $matching->areaAveragePrice(
                $request->service_category_id,
                (float) $request->latitude,
                (float) $request->longitude,
            );

        if ($anchor === null || $anchor <= 0) {
            return (float) random_int(80, 400);
        }

        // ±15% around the anchor, so the bids cluster believably but still
        // differ enough that price sorting in the customer app does something.
        $factor = random_int(85, 115) / 100;

        return max(1.0, round($anchor * $factor, 2));
    }

    private function comment(): string
    {
        return collect([
            'Posso atender agora, tenho o equipamento necessário.',
            'Estou próximo e consigo chegar rápido.',
            'Faço esse serviço com frequência, sem surpresas no valor.',
            'Preço já inclui deslocamento.',
            'Disponível hoje, é só confirmar.',
        ])->random();
    }
}
