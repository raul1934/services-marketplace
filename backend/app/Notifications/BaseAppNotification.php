<?php

namespace App\Notifications;

use App\Notifications\Channels\ExpoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

/**
 * Base for all app notifications. Always records via the `database` channel
 * (in-app list); adds the FCM channel only when push is configured, so the
 * app works end-to-end before Firebase is set up.
 */
abstract class BaseAppNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** Type the mobile app switches on for deep-linking. */
    abstract public function type(): string;

    abstract public function title(): string;

    abstract public function body(): string;

    /**
     * Deep-link payload (ids, status). Values MUST be strings for FCM.
     *
     * @return array<string,string>
     */
    abstract public function payload(): array;

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Realtime over WebSocket (Reverb) — pushed to the user's private
        // channel so open screens update live. Skipped when no broadcaster set.
        if (config('broadcasting.default') !== 'null') {
            $channels[] = 'broadcast';
        }

        // Expo push (managed app) — needs only the device tokens, no creds.
        if (config('services.expo.enabled')) {
            $channels[] = ExpoChannel::class;
        }

        // FCM (native build) — enabled once Firebase credentials are set.
        if (config('services.fcm.enabled')) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    /**
     * Pushed over WebSocket to the recipient's private user channel. The client
     * listens with Echo's `.notification()` helper (default event name), then
     * switches on the `type` field for deep-linking.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage(array_merge([
            'type' => $this->type(),
            'title' => $this->title(),
            'body' => $this->body(),
        ], $this->payload()));
    }

    /** Stored by the database channel. */
    public function toArray(object $notifiable): array
    {
        return array_merge([
            'type' => $this->type(),
            'title' => $this->title(),
            'body' => $this->body(),
        ], $this->payload());
    }

    /**
     * Payload for the Expo push channel.
     *
     * @return array{title:string,body:string,data:array<string,string>}
     */
    public function toExpo(object $notifiable): array
    {
        return [
            'title' => $this->title(),
            'body' => $this->body(),
            'data' => array_merge(['type' => $this->type()], $this->payload()),
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->notification(new FcmNotification($this->title(), $this->body()))
            ->data(array_merge(['type' => $this->type()], $this->payload()))
            ->custom([
                'android' => [
                    'priority' => 'high',
                    'notification' => [
                        'sound' => 'default',
                        'channel_id' => 'guincho_default',
                    ],
                ],
                'apns' => [
                    'payload' => ['aps' => ['sound' => 'default']],
                ],
            ]);
    }
}
