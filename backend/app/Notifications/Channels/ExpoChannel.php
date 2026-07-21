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

        // A notification with no title/body is a silent data message: it carries
        // only `data` and `_contentAvailable`, which wakes the app's background
        // task on Android even when the app is killed (a visible notification
        // message would not). Used to sync the "chamado em andamento" tracker.
        $hasAlert = ! empty($payload['title']) || ! empty($payload['body']);

        $messages = $tokens->map(function (string $token) use ($payload, $hasAlert) {
            $message = [
                'to' => $token,
                'data' => $payload['data'] ?? [],
                'priority' => 'high',
                'channelId' => 'default',
            ];
            if ($hasAlert) {
                $message['title'] = $payload['title'];
                $message['body'] = $payload['body'];
                $message['sound'] = 'default';
            } else {
                $message['_contentAvailable'] = true;
            }

            return $message;
        })->all();

        try {
            Http::acceptJson()->post(self::ENDPOINT, $messages);
        } catch (\Throwable $e) {
            Log::warning('Expo push failed: '.$e->getMessage());
        }
    }
}
