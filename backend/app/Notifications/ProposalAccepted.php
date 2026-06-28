<?php

namespace App\Notifications;

class ProposalAccepted extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'proposal_accepted';
    }

    public function title(): string
    {
        return 'Sua proposta foi aceita!';
    }

    public function body(): string
    {
        return 'O cliente aceitou sua proposta. Bom atendimento!';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
