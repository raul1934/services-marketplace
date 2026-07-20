<?php

namespace App\Bots\Jobs;

use App\Bots\BotGate;
use App\Bots\BotPersona;
use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * TEMPORARY — test bots. Fans out one delayed SubmitBotBid per bot provider.
 *
 * The offsets are cumulative, so with the default 10–20s window five bids land
 * at roughly +15s, +30s, +45s, +60s, +75s rather than all at once — the point
 * is for the customer app to show proposals trickling in.
 *
 * The stagger is done with ->delay() (the database queue driver stores
 * available_at, so the worker simply won't reserve the job until then) and
 * never with sleep()/release() loops: there is a single queue worker in
 * production, so a sleeping job would block every real notification behind it.
 */
class ScheduleBotBids implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $requestId) {}

    public function handle(): void
    {
        if (! BotGate::customerBot()) {
            return;
        }

        $request = ServiceRequest::find($this->requestId);

        if (! $request || $request->status !== RequestStatus::Open) {
            return;
        }

        // Re-check the client here too: this job is queued, so the guard in
        // BotRequestObserver could have been raced by a manual dispatch.
        if ($request->client?->is_bot) {
            return;
        }

        $providers = BotPersona::providers()
            ->shuffle()
            ->take(max(0, (int) config('bots.max_bids_per_request', 5)));

        $min = (int) config('bots.bid_delay_min_seconds', 10);
        $max = max($min, (int) config('bots.bid_delay_max_seconds', 20));

        $offset = 0;

        foreach ($providers as $provider) {
            $offset += random_int($min, $max);

            SubmitBotBid::dispatch($this->requestId, $provider->id)
                ->delay(now()->addSeconds($offset));
        }
    }
}
