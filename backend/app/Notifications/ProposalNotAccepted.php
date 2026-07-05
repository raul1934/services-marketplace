<?php

namespace App\Notifications;

class ProposalNotAccepted extends BaseAppNotification
{
    public function __construct(public int $requestId) {}

    public function type(): string
    {
        return 'proposal_not_accepted';
    }

    public function title(): string
    {
        return 'Outro profissional foi escolhido';
    }

    public function body(): string
    {
        return 'O cliente aceitou a proposta de outro profissional para este chamado.';
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
