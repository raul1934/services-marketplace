<?php

namespace App\Notifications;

/** Notifies the provider whether the client approved or refused the surcharge. */
class SurchargeResolved extends BaseAppNotification
{
    /** @param 'approved'|'refused' $status */
    public function __construct(
        public int $requestId,
        public int $surchargeId,
        public string $status,
    ) {}

    public function type(): string
    {
        return 'surcharge_resolved';
    }

    public function title(): string
    {
        return __('notifications.surcharge_resolved.title');
    }

    public function body(): string
    {
        return __('notifications.surcharge_resolved.body', [
            'status' => __('enums.surcharge_status.'.$this->status),
        ]);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'surcharge_id' => (string) $this->surchargeId,
            'status' => $this->status,
        ];
    }
}
