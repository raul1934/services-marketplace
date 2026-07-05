<?php

namespace App\Notifications;

class CounterOfferDeclined extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'counter_offer_declined';
    }

    public function title(): string
    {
        return 'O profissional recusou sua contraproposta';
    }

    public function body(): string
    {
        return 'O valor original da proposta continua valendo.';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
