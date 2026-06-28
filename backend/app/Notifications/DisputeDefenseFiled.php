<?php

namespace App\Notifications;

/** Notifies the client that the provider filed their dispute defense. */
class DisputeDefenseFiled extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $disputeId,
    ) {}

    public function type(): string
    {
        return 'dispute_defense_filed';
    }

    public function title(): string
    {
        return __('notifications.dispute_defense_filed.title');
    }

    public function body(): string
    {
        return __('notifications.dispute_defense_filed.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'dispute_id' => (string) $this->disputeId,
        ];
    }
}
