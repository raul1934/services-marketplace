<?php

namespace App\Bots\Observers;

use App\Bots\BotGate;
use App\Bots\Jobs\ReactToBotAnswer;
use App\Models\RequestQuestion;

/**
 * TEMPORARY — test bots. Detects the client answering a bot's question.
 *
 * An observer on `updated` rather than a polling command: polling would need an
 * extra column to remember what it already reacted to, plus a per-minute table
 * scan, and would add up to 60s of latency — and latency is exactly what makes
 * a bot feel fake in a chat-like thread.
 *
 * Chosen over hooking Customer\QuestionController::answer() because that would
 * put temporary code inside a production controller, the likeliest place for it
 * to be missed at removal time. It is also robust to a second write path
 * appearing later; today answered_at has exactly one writer.
 */
class BotQuestionObserver
{
    public function updated(RequestQuestion $question): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        // Only the transition into "answered" is interesting.
        if (! $question->wasChanged('answered_at') || $question->answered_at === null) {
            return;
        }

        if (! $question->provider?->is_bot) {
            return;
        }

        // Human-ish pause before replying.
        ReactToBotAnswer::dispatch($question->id)
            ->delay(now()->addSeconds(random_int(8, 25)));
    }
}
