<?php

namespace App\Notifications;

/** Notifies the requester whether their reschedule was accepted or declined. */
class RescheduleResolved extends BaseAppNotification
{
    /** @param 'accepted'|'declined' $status */
    public function __construct(
        public int $requestId,
        public int $rescheduleId,
        public string $status,
    ) {}

    public function type(): string
    {
        return 'reschedule_resolved';
    }

    public function title(): string
    {
        return __('notifications.reschedule_resolved.title');
    }

    public function body(): string
    {
        return __('notifications.reschedule_resolved.body', [
            'status' => __('enums.reschedule_status.'.$this->status),
        ]);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'reschedule_id' => (string) $this->rescheduleId,
            'status' => $this->status,
        ];
    }
}
