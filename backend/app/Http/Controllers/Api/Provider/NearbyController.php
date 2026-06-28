<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\RequestUrgency;
use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NearbyController extends Controller
{
    public function __construct(private readonly MatchingService $matching) {}

    /** Urgent ("now") open requests near the provider, in their categories. */
    public function index(Request $request): AnonymousResourceCollection
    {
        return $this->near($request, RequestUrgency::Urgent);
    }

    /** Scheduled open requests near the provider (the agenda feed). */
    public function scheduled(Request $request): AnonymousResourceCollection
    {
        return $this->near($request, RequestUrgency::Scheduled);
    }

    private function near(Request $request, RequestUrgency $urgency): AnonymousResourceCollection
    {
        $radius = (float) $request->query('radius_km', 30);
        $page = $this->matching->openRequestsNearPaginated($request->user(), $radius, $this->perPage($request), $urgency);
        $requests = $page->getCollection();

        // Load the provider's own bid on each (if any) so the feed can mark
        // already-bid requests (`my_proposal` resolves to the provider's proposal).
        $requests->load(['proposals' => fn ($q) => $q->where('provider_id', $request->user()->id)]);

        // Annotate each with the area's average bid price for its category (one
        // lookup per distinct category), shown as a pricing hint to the provider.
        $averages = [];
        foreach ($requests as $req) {
            $cid = $req->service_category_id;
            $averages[$cid] ??= $this->matching->areaAveragePrice($cid, (float) $req->latitude, (float) $req->longitude, $radius);
            $req->area_avg_price = $averages[$cid];
        }

        return ServiceRequestResource::collection($page);
    }
}
