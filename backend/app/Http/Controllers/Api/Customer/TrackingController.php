<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Services\MatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function __construct(private readonly MatchingService $matching) {}

    /** Live foreground location of the assigned provider, for the client's map. */
    public function show(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($serviceRequest->client_id === $request->user()->id, 403);
        abort_unless($serviceRequest->status->isActive(), 422, __('messages.request_not_active'));

        $location = $serviceRequest->provider?->location;

        if (! $location) {
            return response()->json(['available' => false]);
        }

        $distance = $this->matching->distanceKm(
            (float) $serviceRequest->latitude,
            (float) $serviceRequest->longitude,
            (float) $location->latitude,
            (float) $location->longitude,
        );

        return response()->json([
            'available' => true,
            'latitude' => (float) $location->latitude,
            'longitude' => (float) $location->longitude,
            'accuracy' => $location->accuracy !== null ? (float) $location->accuracy : null,
            'updated_at' => $location->updated_at,
            'distance_km' => round($distance, 2),
            'eta_minutes_approx' => max(1, (int) ceil($distance / 35 * 60)),
        ]);
    }
}
