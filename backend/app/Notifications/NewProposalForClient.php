<?php

namespace App\Notifications;

class NewProposalForClient extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public int $proposalId,
        public float $price,
        public int $etaMinutes,
    ) {}

    public function type(): string
    {
        return 'new_proposal';
    }

    public function title(): string
    {
        return 'Nova proposta recebida';
    }

    public function body(): string
    {
        return 'R$ '.number_format($this->price, 2, ',', '.').", chega em {$this->etaMinutes} min";
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'proposal_id' => (string) $this->proposalId,
        ];
    }
}
