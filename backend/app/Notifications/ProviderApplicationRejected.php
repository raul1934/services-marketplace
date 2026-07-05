<?php

namespace App\Notifications;

class ProviderApplicationRejected extends BaseAppNotification
{
    public function __construct(public ?string $reason = null) {}

    public function type(): string
    {
        return 'provider_application_rejected';
    }

    public function title(): string
    {
        return 'Documento reprovado';
    }

    public function body(): string
    {
        return $this->reason ?? 'Um dos seus documentos não foi aprovado. Envie novamente para continuar.';
    }

    public function payload(): array
    {
        return [];
    }
}
