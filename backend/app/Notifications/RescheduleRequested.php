<?php

namespace App\Notifications;

/** Notifies the counter-party that a reschedule was requested. */
class RescheduleRequested extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $rescheduleId,
    ) {}

    public function type(): string
    {
        return 'reschedule_requested';
    }

    public function title(): string
    {
        return __('notifications.reschedule_requested.title');
    }

    public function body(): string
    {
        return __('notifications.reschedule_requested.body');
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'reschedule_id' => (string) $this->rescheduleId,
        ];
    }
}
