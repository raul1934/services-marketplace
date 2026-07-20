<?php

namespace App\Bots\Console;

use App\Bots\BotDriver;
use App\Bots\BotGate;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\RescheduleStatus;
use App\Enums\SurchargeStatus;
use App\Events\PartsApproved;
use App\Models\ProposalCounterOffer;
use App\Models\RescheduleRequest;
use App\Models\Review;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Services\CounterOfferService;
use App\Services\RescheduleService;
use App\Services\ReviewService;
use App\Services\SurchargeService;
use Illuminate\Console\Command;

/**
 * TEMPORARY — test bots. Plays the client's side of every step a real provider
 * can get blocked on, for jobs a bot client owns.
 *
 * One scanning command instead of an observer per model: these are five
 * heterogeneous models with their own status machines, each step re-checks its
 * own precondition (so the whole thing is naturally idempotent and safe to
 * re-run), and it all deletes as a single file. Sub-minute latency isn't needed
 * for steps a human would take minutes over.
 */
class AdvanceBotJobs extends Command
{
    protected $signature = 'bots:advance';

    protected $description = 'Advance test jobs owned by bot clients (TEMPORARY)';

    public function handle(
        SurchargeService $surcharges,
        RescheduleService $reschedules,
        CounterOfferService $counterOffers,
        ReviewService $reviews,
        BotDriver $driver,
    ): int {
        if (! BotGate::autoAdvance()) {
            return self::SUCCESS;
        }

        $requests = ServiceRequest::query()
            ->where('is_test', true)
            ->whereIn('status', [
                RequestStatus::Open->value,
                RequestStatus::Accepted->value,
                RequestStatus::InProgress->value,
                RequestStatus::Completed->value,
            ])
            ->with('client')
            ->get()
            ->filter(fn (ServiceRequest $r) => $r->client?->is_bot);

        $actions = 0;

        // Jobs a bot PROVIDER is on. Tracked separately from the loop below
        // because those requests belong to real customers — is_test is false on
        // them, so the bot-client scan never sees them. They are the ones that
        // strand a real customer watching a marker that never moves.
        $driven = 0;
        foreach (BotDriver::activeJobs() as $job) {
            if ($driver->drive($job)) {
                $driven++;
            }
        }

        foreach ($requests as $request) {
            $actions += $this->approveParts($request);
            $actions += $this->approveSurcharges($request, $surcharges);
            $actions += $this->acceptReschedules($request, $reschedules);
            $actions += $this->acceptCounterOffers($request, $counterOffers);
            $actions += $this->leaveReview($request, $reviews);
        }

        $this->info("Advanced {$actions} step(s) across {$requests->count()} test job(s); drove {$driven} bot provider(s).");

        return self::SUCCESS;
    }

    /** Mirrors Customer\RequestController::approveParts. */
    private function approveParts(ServiceRequest $request): int
    {
        if ($request->parts_approval_requested_at === null || $request->parts_approved_at !== null) {
            return 0;
        }

        $request->update(['parts_approved_at' => now()]);
        $request->jobParts()->whereNull('approved_at')->update(['approved_at' => now()]);

        if ($request->provider) {
            $request->provider->notify(new \App\Notifications\PartsApproved($request->id));
        }
        PartsApproved::dispatch($request->id);

        return 1;
    }

    private function approveSurcharges(ServiceRequest $request, SurchargeService $surcharges): int
    {
        $pending = Surcharge::where('service_request_id', $request->id)
            ->where('status', SurchargeStatus::Pending->value)
            ->get();

        foreach ($pending as $surcharge) {
            $surcharges->approve($surcharge);
        }

        return $pending->count();
    }

    private function acceptReschedules(ServiceRequest $request, RescheduleService $reschedules): int
    {
        // Only ones awaiting the CLIENT's answer — a reschedule the bot client
        // itself proposed is the provider's to resolve.
        $pending = RescheduleRequest::where('service_request_id', $request->id)
            ->where('status', RescheduleStatus::Pending->value)
            ->where('requested_by_role', '!=', 'client')
            ->get();

        $count = 0;

        foreach ($pending as $reschedule) {
            $reschedules->accept($reschedule, $request->client);
            $count++;
        }

        return $count;
    }

    private function acceptCounterOffers(ServiceRequest $request, CounterOfferService $counterOffers): int
    {
        // A counter-offer is the CLIENT countering a provider's price, and the
        // provider answers it — so a bot client should never have one pending
        // against it. Guarded here anyway so a stray row can't wedge a job.
        $pending = ProposalCounterOffer::query()
            ->whereHas('proposal', fn ($q) => $q->where('service_request_id', $request->id))
            ->where('status', 'pending')
            ->get();

        $count = 0;

        foreach ($pending as $counter) {
            $counterOffers->accept($counter);
            $count++;
        }

        return $count;
    }

    /**
     * Close the loop so the real provider sees a rating land.
     *
     * Goes through ReviewService rather than Review::create so the provider's
     * rating_avg / rating_count / jobs_completed aggregate is rolled forward the
     * same way a real review would — writing the row directly would leave the
     * profile stale. No tip is passed: that would credit a real WalletTransaction.
     */
    private function leaveReview(ServiceRequest $request, ReviewService $reviews): int
    {
        if ($request->status !== RequestStatus::Completed || $request->accepted_provider_id === null) {
            return 0;
        }

        $exists = Review::where('service_request_id', $request->id)
            ->where('author_role', 'client')
            ->exists();

        if ($exists) {
            return 0;
        }

        $reviews->create($request, 5, BotGate::label('Atendimento de teste concluído.'));

        return 1;
    }
}
