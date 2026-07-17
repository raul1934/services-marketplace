<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/**
 * One row of the in-app notification list.
 *
 * @mixin DatabaseNotification
 */
class NotificationResource extends JsonResource
{
    /** @return array<string,mixed> */
    public function toArray(Request $request): array
    {
        $data = $this->data ?? [];

        return [
            'id' => $this->id,
            // The app-facing type from `data` (e.g. "new_proposal") — what the
            // client switches on to deep-link. NOT the `type` column, which is
            // the notification's PHP class name and means nothing to the app.
            'type' => $data['type'] ?? null,
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
            // Whatever the notification's payload() added (ids, status…), minus
            // the three keys above that we surface on their own.
            'payload' => array_diff_key($data, array_flip(['type', 'title', 'body'])),
            'read_at' => optional($this->read_at)->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
