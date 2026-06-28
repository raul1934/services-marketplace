<?php

namespace App\Services;

use App\Enums\DisputeStatus;
use App\Events\DisputeUpdated;
use App\Models\Dispute;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Notifications\DisputeDefenseFiled;
use App\Notifications\DisputeOpened;
use App\Notifications\DisputeResolved;

class DisputeService
{
    /**
     * Client opens a dispute. Retains the provider's split (R-SPLIT) and records
     * the client's claim + evidence.
     *
     * @param  array<string>  $photos
     */
    public function open(ServiceRequest $request, User $client, string $claim, array $photos = []): Dispute
    {
        $dispute = $request->disputes()->create([
            'opened_by_id' => $client->id,
            'claim' => $claim,
            'status' => DisputeStatus::Open->value,
        ]);

        $evidence = $dispute->evidence()->create([
            'party' => 'client',
            'text' => $claim,
        ]);
        foreach (array_values($photos) as $i => $path) {
            $evidence->media()->create([
                'uploaded_by_id' => $client->id, 'disk' => 'public', 'path' => $path, 'tag' => 'dispute', 'position' => $i,
            ]);
        }

        // Retain the split while the dispute is open.
        WalletTransaction::where('service_request_id', $request->id)
            ->where('type', WalletTransaction::TYPE_CREDIT)
            ->update(['status' => WalletTransaction::STATUS_HELD]);

        $request->provider?->notify(new DisputeOpened($request->id, $dispute->id));
        DisputeUpdated::dispatch($request->id, $dispute->id, 'opened');

        return $dispute;
    }

    /**
     * Provider files their defense; the dispute moves to mediation.
     *
     * @param  array<string>  $photos
     */
    public function fileDefense(Dispute $dispute, User $provider, ?string $text, array $photos = []): Dispute
    {
        $evidence = $dispute->evidence()->create([
            'party' => 'provider',
            'text' => $text,
        ]);
        foreach (array_values($photos) as $i => $path) {
            $evidence->media()->create([
                'uploaded_by_id' => $provider->id, 'disk' => 'public', 'path' => $path, 'tag' => 'dispute', 'position' => $i,
            ]);
        }

        $dispute->update(['status' => DisputeStatus::UnderReview->value]);

        $dispute->request->client->notify(new DisputeDefenseFiled($dispute->service_request_id, $dispute->id));
        DisputeUpdated::dispatch($dispute->service_request_id, $dispute->id, 'defense_filed');

        return $dispute->fresh();
    }

    /**
     * Mediation outcome (back-office). Releases the retained split unless the
     * resolution refunds the client (left to the back-office to reverse).
     */
    public function resolve(Dispute $dispute, string $resolution): Dispute
    {
        $dispute->update([
            'status' => DisputeStatus::Resolved->value,
            'resolution' => $resolution,
            'resolved_at' => now(),
        ]);

        WalletTransaction::where('service_request_id', $dispute->service_request_id)
            ->where('type', WalletTransaction::TYPE_CREDIT)
            ->where('status', WalletTransaction::STATUS_HELD)
            ->update(['status' => WalletTransaction::STATUS_COMPLETED]);

        $request = $dispute->request;
        $request->client->notify(new DisputeResolved($request->id, $dispute->id));
        $request->provider?->notify(new DisputeResolved($request->id, $dispute->id));
        DisputeUpdated::dispatch($request->id, $dispute->id, 'resolved');

        return $dispute->fresh();
    }
}
