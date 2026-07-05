<?php

namespace App\Notifications;

class ProviderApplicationApproved extends BaseAppNotification
{
    public function type(): string
    {
        return 'provider_application_approved';
    }

    public function title(): string
    {
        return 'Você foi aprovado!';
    }

    public function body(): string
    {
        return 'Sua verificação foi concluída. Você já pode receber chamados.';
    }

    public function payload(): array
    {
        return [];
    }
}
