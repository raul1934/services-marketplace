<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetReading;
use App\Models\AssetVehicle;
use Illuminate\Support\Facades\DB;

/**
 * Records an odometer reading on a vehicle asset: appends to the immutable
 * `asset_readings` log and bumps the denormalized `current_mileage` (odometers
 * only go up — a lower reading is kept in the log but never lowers the current).
 * Used by both the customer and the provider capture points.
 */
class AssetReadingService
{
    /**
     * @param  array{mileage:int, recorded_at?:mixed, service_request_id?:int|null, note?:string|null}  $data
     */
    public function record(Asset $asset, array $data, string $source, ?int $userId): AssetReading
    {
        return DB::transaction(function () use ($asset, $data, $source, $userId) {
            $reading = $asset->readings()->create([
                'mileage' => $data['mileage'],
                'recorded_at' => $data['recorded_at'] ?? now(),
                'service_request_id' => $data['service_request_id'] ?? null,
                'note' => $data['note'] ?? null,
                'recorded_by_id' => $userId,
                'source' => $source,
            ]);

            $detail = $asset->detailable;
            if ($detail instanceof AssetVehicle && $data['mileage'] > (int) $detail->current_mileage) {
                $detail->update(['current_mileage' => $data['mileage']]);
            }

            return $reading;
        });
    }
}
