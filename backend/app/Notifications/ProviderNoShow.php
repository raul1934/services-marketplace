<?php

namespace App\Notifications;

/** Notifies the client that the provider was a no-show; the request reopens. */
class ProviderNoShow extends BaseAppNotification
{
    public function __construct(
        public int $requestId,
    ) {}

    public function type(): string
    {
        return 'provider_no_show';
    }

    public function title(): string
    {
        return __('notifications.provider_no_show.title');
    }

    public function body(): string
    {
        return __('notifications.provider_no_show.body');
    }

    public function payload(): array
    {
        return ['request_id' => (string) $this->requestId];
    }
}
