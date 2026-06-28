<?php

namespace App\Notifications;

/**
 * Notifies the provider that their earnings for a completed job were credited
 * to the wallet (net of the platform fee). Split happens at completion on the
 * good path (R-SPLIT); per-part repasse may still be retained until each NF is
 * attached, which the wallet screen surfaces separately.
 */
class PaymentSettled extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public float $amount,
    ) {}

    public function type(): string
    {
        return 'payment_settled';
    }

    public function title(): string
    {
        return __('notifications.payment_settled.title');
    }

    public function body(): string
    {
        return __('notifications.payment_settled.body', [
            'amount' => 'R$ '.number_format($this->amount, 2, ',', '.'),
        ]);
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'amount' => number_format($this->amount, 2, '.', ''),
        ];
    }
}
