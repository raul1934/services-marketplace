<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Either party requested a reschedule; surface it live on the request channel. */
class RescheduleRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param 'client'|'provider' $byRole */
    public function __construct(
        public int $requestId,
        public int $rescheduleId,
        public string $byRole,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'reschedule.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'reschedule_id' => $this->rescheduleId,
            'by_role' => $this->byRole,
        ];
    }
}
