<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** The client approved or refused a surcharge. */
class SurchargeResolved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param 'approved'|'refused' $status */
    public function __construct(
        public int $requestId,
        public int $surchargeId,
        public string $status,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'surcharge.resolved';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'surcharge_id' => $this->surchargeId,
            'status' => $this->status,
        ];
    }
}
