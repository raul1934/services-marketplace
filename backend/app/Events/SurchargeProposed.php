<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** The provider proposed a surcharge; surface it live on the request channel. */
class SurchargeProposed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $requestId,
        public int $surchargeId,
        public float $amount,
        public string $tier,
        public float $percentAccumulated,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('request.'.$this->requestId);
    }

    public function broadcastAs(): string
    {
        return 'surcharge.proposed';
    }

    public function broadcastWith(): array
    {
        return [
            'request_id' => $this->requestId,
            'surcharge_id' => $this->surchargeId,
            'amount' => $this->amount,
            'tier' => $this->tier,
            'percent_accumulated' => $this->percentAccumulated,
        ];
    }
}
