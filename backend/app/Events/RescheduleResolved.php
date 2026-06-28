<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** A reschedule request was accepted or declined. */
class RescheduleResolved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param 'accepted'|'declined' $status */
    public function __construct(
        public int $requestId,
        public int $rescheduleId,
        public string $status,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'reschedule.resolved';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'reschedule_id' => $this->rescheduleId,
            'status' => $this->status,
        ];
    }
}
