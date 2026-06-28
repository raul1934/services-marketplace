<?php

namespace App\Notifications;

use Illuminate\Support\Str;

/** Notifies the provider that the client answered their pre-bid question. */
class ClientAnsweredQuestion extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $questionId,
        public string $answer,
    ) {}

    public function type(): string
    {
        return 'question_answered';
    }

    public function title(): string
    {
        return __('notifications.question_answered.title');
    }

    public function body(): string
    {
        return Str::limit($this->answer, 120);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'question_id' => (string) $this->questionId,
        ];
    }
}
