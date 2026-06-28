<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** A dispute changed (opened / defense filed / resolved). */
class DisputeUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param 'opened'|'defense_filed'|'resolved' $action */
    public function __construct(
        public int $requestId,
        public int $disputeId,
        public string $action,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'dispute.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'dispute_id' => $this->disputeId,
            'action' => $this->action,
        ];
    }
}
