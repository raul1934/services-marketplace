<?php

namespace App\Notifications;

/** Notifies the client that the provider is requesting approval of the total. */
class PartsApprovalRequested extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public float $total,
    ) {}

    public function type(): string
    {
        return 'parts_approval_requested';
    }

    public function title(): string
    {
        return __('notifications.parts_approval_requested.title');
    }

    public function body(): string
    {
        return __('notifications.parts_approval_requested.body', ['total' => 'R$ '.number_format($this->total, 2, ',', '.')]);
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
