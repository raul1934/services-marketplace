<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Events\RequestStatusUpdated;
use App\Events\SurchargeProposed as SurchargeProposedEvent;
use App\Events\SurchargeResolved as SurchargeResolvedEvent;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use App\Notifications\RequoteRequired;
use App\Notifications\SurchargeProposed as SurchargeProposedNotification;
use App\Notifications\SurchargeResolved as SurchargeResolvedNotification;

class SurchargeService
{
    /**
     * Provider proposes a surcharge on the active job. The percentage is measured
     * over the original combinado, accumulated across already-approved surcharges
     * (R-ACRÉSCIMO). >50% forces a mandatory re-quote instead of a simple approval.
     *
     * @param  array{amount:float,reason:string,photos?:array<string>}  $data
     */
    public function propose(ServiceRequest $request, User $provider, array $data): Surcharge
    {
        $combinado = (float) ($request->acceptedProposal?->price ?? 0);
        $approvedSum = (float) $request->surcharges()
            ->where('status', SurchargeStatus::Approved->value)
            ->sum('amount');

        $accumulatedExtra = $approvedSum + (float) $data['amount'];
        $percent = $combinado > 0 ? round($accumulatedExtra / $combinado * 100, 2) : 0.0;
        $tier = SurchargeTier::fromPercent($percent);

        $surcharge = $request->surcharges()->create([
            'provider_id' => $provider->id,
            'amount' => $data['amount'],
            'reason' => $data['reason'],
            'percent_accumulated' => $percent,
            'tier' => $tier->value,
            'status' => SurchargeStatus::Pending->value,
        ]);

        // Reason photos (already stored to disk by the controller) → media.
        foreach (array_values($data['photos'] ?? []) as $i => $path) {
            $surcharge->media()->create([
                'uploaded_by_id' => $provider->id, 'disk' => 'public', 'path' => $path, 'tag' => 'surcharge', 'position' => $i,
            ]);
        }

        $request->client->notify(new SurchargeProposedNotification(
            $request->id, $surcharge->id, (float) $surcharge->amount,
        ));
        SurchargeProposedEvent::dispatch(
            $request->id, $surcharge->id, (float) $surcharge->amount, $tier->value, $percent,
        );

        // >50% accumulated → re-quote: pause the job and let the client decide.
        if ($tier === SurchargeTier::Requote) {
            $request->update(['status' => RequestStatus::Requote->value]);
            $request->client->notify(new RequoteRequired($request->id));
            RequestStatusUpdated::dispatch($request->id, RequestStatus::Requote->value);
        }

        return $surcharge;
    }

    /** Client approves the surcharge — it folds into the running total. */
    public function approve(Surcharge $surcharge): Surcharge
    {
        return $this->resolve($surcharge, SurchargeStatus::Approved);
    }

    /** Client refuses — the original combinado stands (refusing is cheap). */
    public function refuse(Surcharge $surcharge): Surcharge
    {
        return $this->resolve($surcharge, SurchargeStatus::Refused);
    }

    private function resolve(Surcharge $surcharge, SurchargeStatus $status): Surcharge
    {
        $surcharge->update(['status' => $status->value, 'resolved_at' => now()]);

        $word = $status === SurchargeStatus::Approved ? 'approved' : 'refused';
        $surcharge->provider->notify(new SurchargeResolvedNotification(
            $surcharge->service_request_id, $surcharge->id, $word,
        ));
        SurchargeResolvedEvent::dispatch($surcharge->service_request_id, $surcharge->id, $word);

        return $surcharge->fresh();
    }
}
