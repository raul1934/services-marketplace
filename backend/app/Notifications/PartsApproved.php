<?php

namespace App\Notifications;

/** Notifies the provider that the client approved the parts/total. */
class PartsApproved extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
    ) {}

    public function type(): string
    {
        return 'parts_approved';
    }

    public function title(): string
    {
        return __('notifications.parts_approved.title');
    }

    public function body(): string
    {
        return __('notifications.parts_approved.body');
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
