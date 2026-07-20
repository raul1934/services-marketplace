<?php

namespace App\Bots;

use App\Enums\PartAction;
use App\Enums\RequestStatus;
use App\Events\PartsApprovalRequested as PartsApprovalRequestedEvent;
use App\Events\ProviderLocationUpdated;
use App\Models\ServiceRequest;
use App\Notifications\PartsApprovalRequested;
use App\Services\JobPartService;
use App\Services\MatchingService;
use App\Services\RequestService;

/**
 * TEMPORARY — test bots. Drives a bot provider from wherever it is to the job,
 * then through start and completion.
 *
 * Without this the tracking screen is a dead end: a bot provider's
 * ProviderLocation is written once by bots:seed and never again (only the
 * provider APP posts positions, and no bot runs one). The customer watches a
 * marker frozen 20-odd km away forever — "o provider nunca chega".
 *
 * Note this deliberately does NOT go through ProviderService::updateLocation:
 * that method randomises coordinates in the local environment (to scatter dev
 * providers around the seeded city), which would teleport the bot instead of
 * walking it toward the customer.
 */
class BotDriver
{
    /** Ground covered per tick. bots:advance runs every minute. */
    private const STEP_KM = 6.0;

    /** Inside this radius the bot counts as on-site. */
    private const ARRIVAL_KM = 0.4;

    /** How long a bot "works" before completing. */
    private const WORK_MINUTES = 3;

    /** How long the bot waits on the customer's parts decision before moving on. */
    private const APPROVAL_GRACE_MINUTES = 5;

    public function __construct(
        private MatchingService $matching,
        private RequestService $requests,
        private JobPartService $parts,
    ) {}

    /**
     * Advance one job by one tick. Returns true when something changed, so the
     * command can report how much it did.
     */
    public function drive(ServiceRequest $request): bool
    {
        $provider = $request->provider;

        if (! $provider?->is_bot) {
            return false;
        }

        return match ($request->status) {
            RequestStatus::Accepted => $this->approach($request),
            RequestStatus::InProgress => $this->finishWhenDue($request),
            default => false,
        };
    }

    /** Move toward the job; start the service on arrival. */
    private function approach(ServiceRequest $request): bool
    {
        $location = $request->provider->location;

        if (! $location) {
            return false;
        }

        $km = $this->matching->distanceKm(
            (float) $location->latitude,
            (float) $location->longitude,
            (float) $request->latitude,
            (float) $request->longitude,
        );

        if ($km > self::ARRIVAL_KM) {
            // Linear interpolation toward the target. Not a road route — the map
            // draws its own OSRM polyline; this only needs to look like progress.
            $fraction = min(1.0, self::STEP_KM / $km);
            $lat = (float) $location->latitude + ((float) $request->latitude - (float) $location->latitude) * $fraction;
            $lng = (float) $location->longitude + ((float) $request->longitude - (float) $location->longitude) * $fraction;

            $location->update(['latitude' => round($lat, 7), 'longitude' => round($lng, 7)]);

            // Same event the real provider app's pings emit, so the customer's
            // map moves live over the websocket instead of only on refresh.
            ProviderLocationUpdated::dispatch($request->id, $lat, $lng, null);

            $km = $this->matching->distanceKm($lat, $lng, (float) $request->latitude, (float) $request->longitude);
        }

        // Re-checked after moving, so the step that lands on the customer also
        // starts the job. Otherwise the tracking screen sat on "a caminho" at
        // 0 m for a whole extra tick, which reads as stuck.
        if ($km <= self::ARRIVAL_KM) {
            // Start directly rather than through Provider\JobController::start,
            // which demands the customer's start_code — no human to read it out.
            $this->requests->updateStatus($request, RequestStatus::InProgress);
        }

        return true;
    }

    /**
     * While on site: log a part, ask the customer to approve the new total, then
     * wrap up. Adding a part is the common real case ("achei que precisa trocar
     * a bateria") and it's what the customer's on-site panel exists to show.
     */
    private function finishWhenDue(ServiceRequest $request): bool
    {
        if ($request->started_at === null) {
            return false;
        }

        // First working tick: put a part on the bill. JobPartService broadcasts
        // progress.updated, so it appears on the customer's screen live.
        if ($request->jobParts()->count() === 0) {
            $name = collect([
                'Bateria 60Ah',
                'Correia do alternador',
                'Fusível principal',
                'Cabo de bateria',
                'Filtro de combustível',
            ])->random();

            // Priced as a fraction of the agreed labour rather than a fixed
            // amount: a flat R$420 part on a R$190 job produced a 200%+ jump,
            // which is not a scenario worth rehearsing against.
            $labour = (float) ($request->acceptedProposal?->price ?? 150);
            $price = round($labour * random_int(15, 45) / 100, 2);

            $this->parts->add($request, [
                'name' => BotGate::label($name),
                'action' => PartAction::Replaced->value,
                'quantity' => 1,
                'unit_price' => max(10.0, $price),
            ]);

            return true;
        }

        // Second tick: ask for approval on the new total, mirroring what
        // Provider\JobController::requestApproval does.
        if ($request->parts_approval_requested_at === null) {
            $labor = (float) ($request->acceptedProposal?->price ?? 0);
            $parts = $request->jobParts()->get()->sum(fn ($p) => (float) ($p->unit_price ?? 0) * $p->quantity);

            $request->update(['parts_approval_requested_at' => now(), 'parts_approved_at' => null]);
            $request->client->notify(new PartsApprovalRequested($request->id, $labor + $parts));
            PartsApprovalRequestedEvent::dispatch($request->id, $labor + $parts);

            return true;
        }

        // A pending approval is the customer's to answer, so don't complete over
        // their head — but don't hang forever either. A real customer testing
        // the app may simply never tap approve, and an in_progress job that can
        // never finish is worse than useless: it sits on their home screen for
        // good. After the grace period the bot does what a provider would do
        // when the customer won't authorise the part — takes it back off the
        // bill and finishes with labour only.
        if ($request->parts_approved_at === null) {
            $askedAt = $request->parts_approval_requested_at;

            if ($askedAt === null || $askedAt->diffInMinutes(now()) < self::APPROVAL_GRACE_MINUTES) {
                return false;
            }

            foreach ($request->jobParts()->whereNull('approved_at')->get() as $part) {
                $this->parts->remove($part);
            }

            $request->update(['parts_approval_requested_at' => null]);
        }

        if ($request->started_at->diffInMinutes(now()) < self::WORK_MINUTES) {
            return false;
        }

        $this->requests->updateStatus($request, RequestStatus::Completed);

        return true;
    }

    /**
     * Jobs a bot provider is currently on — whoever the customer is.
     *
     * Deliberately NOT filtered by is_test: a bot provider bidding on a REAL
     * customer's request is the main Customer Bot flow, and that request is not
     * a test row. Those are exactly the jobs that would otherwise strand a real
     * customer on the tracking screen.
     *
     * @return \Illuminate\Support\Collection<int, ServiceRequest>
     */
    public static function activeJobs()
    {
        return ServiceRequest::query()
            ->whereIn('status', [RequestStatus::Accepted->value, RequestStatus::InProgress->value])
            ->whereNotNull('accepted_provider_id')
            ->whereHas('provider', fn ($q) => $q->where('is_bot', true))
            ->with(['provider.location', 'client'])
            ->get();
    }
}
