<?php

namespace App\Jobs;

use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use App\Notifications\NewRequestForProviders;
use App\Services\MatchingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchNewRequestToProviders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $requestId) {}

    public function handle(MatchingService $matching): void
    {
        $request = ServiceRequest::with('category')->find($this->requestId);

        if (! $request || $request->status !== RequestStatus::Open) {
            return;
        }

        $providers = $matching->onlineProvidersNear(
            $request,
            (float) config('matching.radius_km', 30),
            (int) config('matching.provider_limit', 50),
        );

        foreach ($providers as $provider) {
            $provider->notify(new NewRequestForProviders(
                $request->id,
                $request->category->name,
                isset($provider->distance_km) ? (float) $provider->distance_km : null,
            ));
        }
    }
}
