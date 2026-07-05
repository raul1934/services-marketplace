<?php

namespace App\Notifications;

class RequestExpired extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'request_expired';
    }

    public function title(): string
    {
        return 'Ninguém respondeu a tempo';
    }

    public function body(): string
    {
        return 'Nenhum profissional respondeu dentro do prazo. Toque para pedir novamente.';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
