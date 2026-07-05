<?php

namespace App\Notifications;

class ProposalDeclined extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'proposal_declined';
    }

    public function title(): string
    {
        return 'Proposta recusada';
    }

    public function body(): string
    {
        return 'O cliente recusou sua proposta para este chamado.';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
