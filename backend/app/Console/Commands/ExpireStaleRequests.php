<?php

namespace App\Console\Commands;

use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Events\RequestStatusUpdated;
use App\Models\ServiceRequest;
use App\Notifications\RequestExpired;
use Illuminate\Console\Command;

/**
 * Urgent requests the client set a max wait for, past that wait with no
 * proposal accepted, expire instead of sitting open forever (C-EXPIRA).
 */
class ExpireStaleRequests extends Command
{
    protected $signature = 'requests:expire-stale';

    protected $description = 'Expire open urgent requests whose max_wait_minutes has elapsed';

    public function handle(): int
    {
        $count = 0;

        // Per-row threshold (created_at + max_wait_minutes) isn't a plain column
        // comparison, so filter candidates in PHP rather than reach for
        // database-specific date-math SQL — this table is small (open+urgent,
        // still unanswered), so there's no real cost to it.
        ServiceRequest::where('status', RequestStatus::Open->value)
            ->where('urgency', RequestUrgency::Urgent->value)
            ->whereNotNull('max_wait_minutes')
            ->chunkById(100, function ($requests) use (&$count) {
                foreach ($requests as $request) {
                    if ($request->created_at->addMinutes($request->max_wait_minutes)->isFuture()) {
                        continue;
                    }
                    $request->update(['status' => RequestStatus::Expired->value]);
                    $request->client->notify(new RequestExpired($request->id));
                    RequestStatusUpdated::dispatch($request->id, RequestStatus::Expired->value);
                    $count++;
                }
            });

        $this->info("Expired {$count} stale request(s).");

        return self::SUCCESS;
    }
}
