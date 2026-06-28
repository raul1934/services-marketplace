<?php

namespace App\Notifications;

class NewRequestForProviders extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public string $categoryName,
        public ?float $distanceKm = null,
    ) {}

    public function type(): string
    {
        return 'new_request';
    }

    public function title(): string
    {
        return 'Novo chamado';
    }

    public function body(): string
    {
        $dist = $this->distanceKm !== null
            ? ' a '.number_format($this->distanceKm, 1, ',', '.').' km'
            : '';

        return "Novo chamado de {$this->categoryName}{$dist}";
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
