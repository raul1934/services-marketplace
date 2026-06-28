<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * The provider asked the client to approve the running total. Broadcast on the
 * request channel so the client's open service screen reflects the pending
 * approval live, alongside the per-user push notification.
 */
class PartsApprovalRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $requestId,
        public float $total,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'parts.approval_requested';
    }

    public function broadcastWith(): array
    {
        return ['request_id' => $this->requestId, 'total' => $this->total];
    }
}
