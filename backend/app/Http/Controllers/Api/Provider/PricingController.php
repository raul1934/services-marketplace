<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Services\MatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Pricing hints for providers: the area's average bid price for a category. */
class PricingController extends Controller
{
    public function __construct(private readonly MatchingService $matching) {}

    public function areaAverage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_category_id' => ['required', 'integer', 'exists:service_categories,id'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'radius_km' => ['nullable', 'numeric', 'min:1', 'max:200'],
        ]);

        // Fall back to the provider's stored location when coordinates aren't given.
        $location = $request->user()->location;
        $lat = $data['latitude'] ?? (float) optional($location)->latitude;
        $lng = $data['longitude'] ?? (float) optional($location)->longitude;

        $average = ($lat && $lng)
            ? $this->matching->areaAveragePrice((int) $data['service_category_id'], (float) $lat, (float) $lng, (float) ($data['radius_km'] ?? 30))
            : null;

        return response()->json([
            'service_category_id' => (int) $data['service_category_id'],
            'area_avg_price' => $average,
        ]);
    }
}
