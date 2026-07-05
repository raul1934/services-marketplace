<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the live map page. A plain JSON endpoint polled by Alpine on a JS
 * interval — deliberately NOT called through Livewire's $wire proxy: the map
 * is wire:ignore'd so Livewire's re-render cycle never touches it, and
 * (observed while building this) the $wire proxy captured from x-init and
 * passed across a function boundary stopped resolving any property,
 * including built-in aliases like $refresh — a plain authenticated fetch()
 * sidesteps that entirely.
 */
class MapMarkersController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $requests = ServiceRequest::activeInMarketScope($request->user())
            ->with(['client', 'category', 'provider.location'])
            ->get(['id', 'market_id', 'client_id', 'accepted_provider_id', 'service_category_id', 'latitude', 'longitude', 'status']);

        $customers = $requests->map(fn (ServiceRequest $r) => [
            'id' => $r->id, 'lat' => $r->latitude, 'lng' => $r->longitude,
            'status' => $r->status->value, 'label' => $r->client?->name,
            'icon' => $r->category?->icon, 'categoryId' => $r->service_category_id,
        ]);

        // Only accepted/in-progress requests have a provider at all, and only
        // if that provider has ever sent a GPS ping (ProviderService::updateLocation()).
        $providers = $requests
            ->filter(fn (ServiceRequest $r) => $r->provider?->location)
            ->map(fn (ServiceRequest $r) => [
                'id' => $r->id, 'lat' => $r->provider->location->latitude, 'lng' => $r->provider->location->longitude,
                'status' => $r->status->value, 'label' => $r->provider->name,
            ])
            ->values();

        return response()->json(['customers' => $customers, 'providers' => $providers]);
    }
}
