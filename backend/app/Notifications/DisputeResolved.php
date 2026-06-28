<?php

namespace App\Notifications;

/** Notifies both parties that the dispute was resolved by mediation. */
class DisputeResolved extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $disputeId,
    ) {}

    public function type(): string
    {
        return 'dispute_resolved';
    }

    public function title(): string
    {
        return __('notifications.dispute_resolved.title');
    }

    public function body(): string
    {
        return __('notifications.dispute_resolved.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'dispute_id' => (string) $this->disputeId,
        ];
    }
}
