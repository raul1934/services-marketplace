<?php

namespace App\Notifications;

/** Notifies the client that their warranty claim status changed. */
class WarrantyStatusChanged extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $warrantyId,
        public string $status,
    ) {}

    public function type(): string
    {
        return 'warranty_status';
    }

    public function title(): string
    {
        return __('notifications.warranty_status.title');
    }

    public function body(): string
    {
        return __('notifications.warranty_status.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'warranty_id' => (string) $this->warrantyId,
            'status' => $this->status,
        ];
    }
}
