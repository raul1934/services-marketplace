<?php

namespace App\Notifications;

use Illuminate\Support\Str;

/** Notifies the client that a provider asked a pre-bid question. */
class ProviderAskedQuestion extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $questionId,
        public string $question,
    ) {}

    public function type(): string
    {
        return 'question_asked';
    }

    public function title(): string
    {
        return __('notifications.question_asked.title');
    }

    public function body(): string
    {
        return Str::limit($this->question, 120);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'question_id' => (string) $this->questionId,
        ];
    }
}
