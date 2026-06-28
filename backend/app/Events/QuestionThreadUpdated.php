<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A pre-bid Q&A thread changed (a provider asked, or the client answered).
 * Broadcast on the request channel so the open "fio de perguntas" updates live
 * for both sides — and for every other provider bidding on the same request,
 * since answers are shared (R-PERGUNTAS). The window is open while the request
 * is published and not yet claimed.
 */
class QuestionThreadUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param 'asked'|'answered' $action */
    public function __construct(
        public int $requestId,
        public int $questionId,
        public string $action,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'question.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'question_id' => $this->questionId,
            'action' => $this->action,
        ];
    }
}
