<?php

namespace App\Notifications;

use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use App\Notifications\Channels\ExpoChannel;

/**
 * Silent, data-only push that keeps the customer's persistent "chamado em
 * andamento" notification in sync as the request advances. Delivered ONLY over
 * Expo push (no database/broadcast alert) with no title/body, so it wakes the
 * app's background task — which upserts or clears the ongoing notification —
 * even when the app is killed. The visible "status changed" alert is a separate
 * notification (RequestStatusChanged).
 */
class ActiveRequestSync extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
        public RequestStatus $status,
    ) {}

    /** Push only — this is a background sync, not a user-facing alert. */
    public function via(object $notifiable): array
    {
        return config('services.expo.enabled') ? [ExpoChannel::class] : [];
    }

    public function type(): string
    {
        return 'active_request';
    }

    // Empty title/body => ExpoChannel sends a silent data message.
    public function title(): string
    {
        return '';
    }

    public function body(): string
    {
        return '';
    }

    public function payload(): array
    {
        $terminal = in_array($this->status, [
            RequestStatus::Completed,
            RequestStatus::Cancelled,
            RequestStatus::Expired,
        ], true);

        return [
            'request_id' => (string) $this->requestId,
            'active_action' => $terminal ? 'clear' : 'upsert',
            'active_status' => $this->status->value,
            'active_title' => ServiceRequest::find($this->requestId)?->category?->name ?? 'Chamado em andamento',
            'active_body' => match ($this->status) {
                RequestStatus::Accepted => 'Prestador a caminho',
                RequestStatus::InProgress => 'Em atendimento',
                RequestStatus::Requote => 'Recotação pendente',
                default => 'Chamado em andamento',
            },
        ];
    }
}
