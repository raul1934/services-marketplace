<?php

namespace App\Bots\Jobs;

use App\Bots\BotGate;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Events\QuestionThreadUpdated;
use App\Models\Proposal;
use App\Models\QuestionSuggestion;
use App\Notifications\ProviderAskedQuestion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * TEMPORARY — test bots. A bot provider asks the client a pre-bid question.
 *
 * There is no chat in this product; the pre-bid Q&A (request_questions) is the
 * only client<->provider channel, and it runs provider-asks / client-answers.
 * So the bot drives the side it can: it asks, and reacts to the answer via
 * BotQuestionObserver -> ReactToBotAnswer.
 *
 * Dispatched only from SubmitBotBid, i.e. always after the bid exists —
 * Api\Customer\QuestionController hides and refuses to answer questions from
 * providers without a live proposal.
 */
class AskBotQuestion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Kept below the controller's MAX_QUESTIONS (3) so a bot never hogs the thread. */
    private const MAX_BOT_QUESTIONS = 2;

    public function __construct(public int $proposalId) {}

    public function handle(): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        $proposal = Proposal::with(['request.category', 'provider'])->find($this->proposalId);

        if (! $proposal || ! $proposal->provider?->is_bot) {
            return;
        }

        $request = $proposal->request;

        // The bid must still be live, or the question would be invisible to the
        // client anyway (the customer controller filters on Pending|Accepted).
        if (! $request || $request->status !== RequestStatus::Open) {
            return;
        }

        if (! in_array($proposal->status, [ProposalStatus::Pending, ProposalStatus::Accepted], true)) {
            return;
        }

        $asked = $request->questions()->where('provider_id', $proposal->provider_id)->count();

        if ($asked >= self::MAX_BOT_QUESTIONS) {
            return;
        }

        [$text, $suggestionId, $imageRequired] = $this->pickQuestion($request, $asked);

        $question = $request->questions()->create([
            'provider_id' => $proposal->provider_id,
            'suggestion_id' => $suggestionId,
            'question' => $text,
            'image_required' => $imageRequired,
        ]);

        // Mirror the two side effects Provider\QuestionController::store fires,
        // so the customer app's thread behaves identically to a real provider's.
        $request->client->notify(
            new ProviderAskedQuestion($request->id, $question->id, $question->question)
        );
        QuestionThreadUpdated::dispatch($request->id, $question->id, 'asked');
    }

    /**
     * Prefer a real QuestionSuggestion for the request's category — the text is
     * already plausible and localized, and suggestion_id keeps the same tracking
     * link a human provider's pick would leave. Falls back to a generic line
     * when the category has no suggestions seeded.
     *
     * @return array{0:string,1:?int,2:bool}
     */
    private function pickQuestion($request, int $alreadyAsked): array
    {
        $suggestion = QuestionSuggestion::query()
            ->active()
            ->where('lang', app()->getLocale())
            ->where('category_type', $request->category?->type?->value)
            ->where(function ($q) use ($request) {
                $q->whereNull('service_category_id')
                    ->orWhere('service_category_id', $request->service_category_id);
            })
            ->whereNotIn(
                'id',
                $request->questions()->whereNotNull('suggestion_id')->pluck('suggestion_id')
            )
            ->inRandomOrder()
            ->first();

        if ($suggestion) {
            return [$suggestion->text, $suggestion->id, (bool) $suggestion->image_required];
        }

        $fallbacks = [
            'Consegue me confirmar o local exato de acesso?',
            'Há alguma restrição de horário para o atendimento?',
            'Você já tentou alguma coisa antes de abrir o chamado?',
        ];

        return [
            BotGate::label($fallbacks[$alreadyAsked % count($fallbacks)]),
            null,
            false,
        ];
    }
}
