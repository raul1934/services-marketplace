<?php

namespace App\Notifications;

/** Notifies the provider that the client opened a dispute. */
class DisputeOpened extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $disputeId,
    ) {}

    public function type(): string
    {
        return 'dispute_opened';
    }

    public function title(): string
    {
        return __('notifications.dispute_opened.title');
    }

    public function body(): string
    {
        return __('notifications.dispute_opened.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'dispute_id' => (string) $this->disputeId,
        ];
    }
}
