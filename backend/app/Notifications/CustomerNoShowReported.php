<?php

namespace App\Notifications;

class CustomerNoShowReported extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'customer_no_show';
    }

    public function title(): string
    {
        return 'Chamado cancelado';
    }

    public function body(): string
    {
        return 'O profissional reportou que você não estava no local combinado.';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
