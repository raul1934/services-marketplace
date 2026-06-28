<?php

namespace App\Notifications;

/** Notifies ops (admins) that a client opened a warranty claim. */
class WarrantyClaimOpened extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $warrantyId,
    ) {}

    public function type(): string
    {
        return 'warranty_opened';
    }

    public function title(): string
    {
        return __('notifications.warranty_opened.title');
    }

    public function body(): string
    {
        return __('notifications.warranty_opened.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'warranty_id' => (string) $this->warrantyId,
        ];
    }
}
