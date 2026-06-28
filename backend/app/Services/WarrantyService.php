<?php

namespace App\Services;

use App\Enums\WarrantyStatus;
use App\Enums\WarrantyType;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WarrantyClaim;
use App\Notifications\WarrantyClaimOpened;
use App\Notifications\WarrantyStatusChanged;

class WarrantyService
{
    /** Window within which a completed job can be claimed under warranty. */
    public const WINDOW_DAYS = 7;

    public function open(ServiceRequest $request, User $client, WarrantyType $type, ?string $description): WarrantyClaim
    {
        $claim = $request->warrantyClaims()->create([
            'client_id' => $client->id,
            'type' => $type->value,
            'status' => WarrantyStatus::Open->value,
            'description' => $description,
            'deadline_at' => $request->completed_at?->copy()->addDays(self::WINDOW_DAYS),
        ]);

        // Route to ops (back-office) for triage and new-provider assignment.
        User::where('is_admin', true)->get()
            ->each(fn (User $admin) => $admin->notify(new WarrantyClaimOpened($request->id, $claim->id)));

        return $claim;
    }

    /** Back-office advances the claim (accepted → in_progress → resolved). */
    public function updateStatus(WarrantyClaim $claim, WarrantyStatus $status): WarrantyClaim
    {
        $claim->update([
            'status' => $status->value,
            'resolved_at' => $status === WarrantyStatus::Resolved ? now() : $claim->resolved_at,
        ]);

        $claim->client->notify(new WarrantyStatusChanged($claim->service_request_id, $claim->id, $status->value));

        return $claim->fresh();
    }
}
