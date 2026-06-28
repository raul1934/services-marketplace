<?php

namespace App\Notifications;

/**
 * Notifies the client that a mandatory re-quote was triggered — the accumulated
 * surcharge passed ~50% of the combinado, or the scope became another service
 * (R-ACRÉSCIMO). The request goes back to a quoting state and the client decides
 * (accept the present provider's new quote, or reopen to others).
 */
class RequoteRequired extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
    ) {}

    public function type(): string
    {
        return 'requote_required';
    }

    public function title(): string
    {
        return __('notifications.requote_required.title');
    }

    public function body(): string
    {
        return __('notifications.requote_required.body');
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
