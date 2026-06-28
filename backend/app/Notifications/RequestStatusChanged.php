<?php

namespace App\Notifications;

use App\Enums\RequestStatus;

class RequestStatusChanged extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public RequestStatus $status,
    ) {}

    public function type(): string
    {
        return 'status_changed';
    }

    public function title(): string
    {
        return 'Atualização do atendimento';
    }

    public function body(): string
    {
        return match ($this->status) {
            RequestStatus::InProgress => 'O prestador está a caminho.',
            RequestStatus::Completed => 'Serviço concluído.',
            RequestStatus::Cancelled => 'O chamado foi cancelado.',
            default => 'O status do seu chamado foi atualizado.',
        };
    }

    public function payload(): array
    {
        return [
            'request_id' => (string) $this->requestId,
            'status' => $this->status->value,
        ];
    }
}
