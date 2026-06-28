<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\AssetType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetReadingResource;
use App\Models\ServiceRequest;
use App\Services\AssetReadingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Provider records the vehicle's odometer during a service (e.g. an oil change). */
class OdometerController extends Controller
{
    public function __construct(private readonly AssetReadingService $readings) {}

    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->accepted_provider_id === $request->user()->id, 403);

        $asset = $serviceRequest->asset;
        abort_unless($asset && $asset->type === AssetType::Vehicle, 422, __('messages.invalid_status'));

        $data = $request->validate([
            'mileage' => ['required', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);

        $asset->loadMissing('detailable');
        $reading = $this->readings->record($asset, [
            'mileage' => $data['mileage'],
            'service_request_id' => $serviceRequest->id,
            'note' => $data['note'] ?? null,
        ], 'provider', $request->user()->id);

        return (new AssetReadingResource($reading))
            ->additional(['current_mileage' => $asset->fresh()->load('detailable')->detailable?->current_mileage])
            ->response()->setStatusCode(201);
    }
}
