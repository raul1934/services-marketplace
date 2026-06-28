<?php

namespace App\Notifications;

/** Notifies the client that the provider proposed a surcharge to approve. */
class SurchargeProposed extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $surchargeId,
        public float $amount,
    ) {}

    public function type(): string
    {
        return 'surcharge_proposed';
    }

    public function title(): string
    {
        return __('notifications.surcharge_proposed.title');
    }

    public function body(): string
    {
        return __('notifications.surcharge_proposed.body', [
            'amount' => 'R$ '.number_format($this->amount, 2, ',', '.'),
        ]);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'surcharge_id' => (string) $this->surchargeId,
            'amount' => number_format($this->amount, 2, '.', ''),
        ];
    }
}
