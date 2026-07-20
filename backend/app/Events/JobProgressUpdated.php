<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * The provider changed what's happening on an active job — added or removed a
 * part, or posted a timeline update.
 *
 * Distinct from parts.approval_requested / parts.approved, which are about the
 * customer's decision. This one fires on every individual change, so the
 * customer's screen can show the work taking shape (a part being added, a photo
 * posted) instead of only learning about it when approval is finally requested.
 */
class JobProgressUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param  'part_added'|'part_removed'|'update_added'  $kind */
    public function __construct(
        public int $requestId,
        public string $kind,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'progress.updated';
    }

    public function broadcastWith(): array
    {
        return ['request_id' => $this->requestId, 'kind' => $this->kind];
    }
}
