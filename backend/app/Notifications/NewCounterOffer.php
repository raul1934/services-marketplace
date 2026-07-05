<?php

namespace App\Notifications;

class NewCounterOffer extends BaseAppNotification
{
    public function __construct(public int $requestId, public float $price) {}

    public function type(): string
    {
        return 'counter_offer_received';
    }

    public function title(): string
    {
        return 'O cliente propôs um novo valor';
    }

    public function body(): string
    {
        return sprintf('Contraproposta: R$ %.2f', $this->price);
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
