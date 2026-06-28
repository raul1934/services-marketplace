<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Delivers notifications to Expo push tokens via Expo's push service
 * (https://exp.host/--/api/v2/push/send). This is the right channel for a
 * managed Expo app: the device registers an `ExponentPushToken[...]` and Expo
 * fans it out to APNs/FCM. No server credentials are required — only the tokens.
 *
 * The notification must implement `toExpo($notifiable): array` returning
 * ['title' => ..., 'body' => ..., 'data' => [...]].
 */
class ExpoChannel
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toExpo')) {
            return;
        }

        $tokens = collect($notifiable->routeNotificationFor('expo', $notification))
            ->filter(fn ($t) => is_string($t) && str_starts_with($t, 'ExponentPushToken'))
            ->values();

        if ($tokens->isEmpty()) {
            return;
        }

        /** @var array{title:string,body:string,data:array<string,string>} $payload */
        $payload = $notification->toExpo($notifiable);

        $messages = $tokens->map(fn (string $token) => [
            'to' => $token,
            'title' => $payload['title'],
            'body' => $payload['body'],
            'data' => $payload['data'] ?? [],
            'sound' => 'default',
            'priority' => 'high',
            'channelId' => 'default',
        ])->all();

        try {
            Http::acceptJson()->post(self::ENDPOINT, $messages);
        } catch (\Throwable $e) {
            Log::warning('Expo push failed: '.$e->getMessage());
        }
    }
}
