<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Proximity matching via the haversine formula (Postgres).
 *
 * A bounding-box prefilter on (latitude, longitude) lets the DB use the
 * btree index before the trig math runs on the survivors. acos() is clamped
 * to [-1, 1] with least/greatest to avoid NaN from float rounding.
 */
class MatchingService
{
    private const EARTH_RADIUS_KM = 6371;

    /**
     * Online providers serving the request's category within $radiusKm,
     * each annotated with a `distance_km` attribute. Used by the fan-out job.
     *
     * @return Collection<int, User>
     */
    public function onlineProvidersNear(ServiceRequest $request, float $radiusKm = 30, int $limit = 50): Collection
    {
        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;
        [$latMin, $latMax, $lngMin, $lngMax] = $this->boundingBox($lat, $lng, $radiusKm);

        $haversine = $this->haversineSql('provider_locations.latitude', 'provider_locations.longitude');

        return User::query()
            ->select('users.*')
            ->selectRaw("{$haversine} AS distance_km", [$lat, $lng, $lat])
            ->join('provider_profiles', 'provider_profiles.user_id', '=', 'users.id')
            ->join('provider_locations', 'provider_locations.user_id', '=', 'users.id')
            ->join('provider_categories', 'provider_categories.user_id', '=', 'users.id')
            ->where('provider_profiles.is_online', true)
            ->where('provider_categories.service_category_id', $request->service_category_id)
            ->where('users.id', '!=', $request->client_id)
            ->whereBetween('provider_locations.latitude', [$latMin, $latMax])
            ->whereBetween('provider_locations.longitude', [$lngMin, $lngMax])
            ->whereRaw("{$haversine} <= ?", [$lat, $lng, $lat, $radiusKm])
            ->orderBy('distance_km')
            ->limit($limit)
            ->get();
    }

    /**
     * Open requests near a provider's current location, in the categories they
     * serve, each annotated with `distance_km`. Used by the provider's nearby list.
     *
     * Optionally narrowed to a single urgency (urgent "now" feed vs scheduled).
     *
     * @return Collection<int, ServiceRequest>
     */
    public function openRequestsNear(User $provider, float $radiusKm = 30, int $limit = 50, ?RequestUrgency $urgency = null): Collection
    {
        $query = $this->openRequestsNearQuery($provider, $radiusKm, $urgency);

        return $query ? $query->limit($limit)->get() : collect();
    }

    /**
     * Page-based variant of {@see openRequestsNear()} for the provider's nearby
     * feed. Returns an empty paginator when the provider has no location or
     * serves no categories.
     */
    public function openRequestsNearPaginated(User $provider, float $radiusKm, int $perPage, ?RequestUrgency $urgency = null): LengthAwarePaginator
    {
        $query = $this->openRequestsNearQuery($provider, $radiusKm, $urgency);

        return $query
            ? $query->paginate($perPage)
            : new LengthAwarePaginator([], 0, $perPage, 1, ['path' => LengthAwarePaginator::resolveCurrentPath()]);
    }

    /** Shared builder for the nearby-open-requests query; null when not servable. */
    private function openRequestsNearQuery(User $provider, float $radiusKm, ?RequestUrgency $urgency): ?Builder
    {
        $location = $provider->location;
        $categoryIds = $provider->categories()->pluck('service_categories.id');

        if (! $location || $categoryIds->isEmpty()) {
            return null;
        }

        $lat = (float) $location->latitude;
        $lng = (float) $location->longitude;
        [$latMin, $latMax, $lngMin, $lngMax] = $this->boundingBox($lat, $lng, $radiusKm);

        $haversine = $this->haversineSql('service_requests.latitude', 'service_requests.longitude');

        return ServiceRequest::query()
            ->select('service_requests.*')
            ->selectRaw("{$haversine} AS distance_km", [$lat, $lng, $lat])
            ->where('status', RequestStatus::Open->value)
            ->when($urgency, fn ($q) => $q->where('urgency', $urgency->value))
            ->whereIn('service_category_id', $categoryIds)
            ->whereBetween('latitude', [$latMin, $latMax])
            ->whereBetween('longitude', [$lngMin, $lngMax])
            ->whereRaw("{$haversine} <= ?", [$lat, $lng, $lat, $radiusKm])
            ->orderBy('distance_km')
            ->with(['category', 'photos', 'availabilities', 'asset'])
            ->withCount('proposals');
    }

    /**
     * Average accepted bid price for a category around a point — the "area avg"
     * shown as a pricing hint to providers. Computed over accepted proposals on
     * requests within $radiusKm. Returns null when there's no history yet.
     */
    public function areaAveragePrice(int $categoryId, float $lat, float $lng, float $radiusKm = 30): ?float
    {
        [$latMin, $latMax, $lngMin, $lngMax] = $this->boundingBox($lat, $lng, $radiusKm);
        $haversine = $this->haversineSql('service_requests.latitude', 'service_requests.longitude');

        $avg = \App\Models\Proposal::query()
            ->where('proposals.status', \App\Enums\ProposalStatus::Accepted->value)
            ->join('service_requests', 'service_requests.id', '=', 'proposals.service_request_id')
            ->where('service_requests.service_category_id', $categoryId)
            ->whereBetween('service_requests.latitude', [$latMin, $latMax])
            ->whereBetween('service_requests.longitude', [$lngMin, $lngMax])
            ->whereRaw("{$haversine} <= ?", [$lat, $lng, $lat, $radiusKm])
            ->avg('proposals.price');

        return $avg !== null ? round((float) $avg, 2) : null;
    }

    /** Straight-line distance in km between two points (for ETA / tracking display). */
    public function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return self::EARTH_RADIUS_KM * 2 * asin(min(1, sqrt($a)));
    }

    private function haversineSql(string $latCol, string $lngCol): string
    {
        $r = self::EARTH_RADIUS_KM;

        return "({$r} * acos(least(1, greatest(-1, "
            ."cos(radians(?)) * cos(radians({$latCol})) * cos(radians({$lngCol}) - radians(?)) "
            ."+ sin(radians(?)) * sin(radians({$latCol}))"
            ."))))";
    }

    /**
     * @return array{0:float,1:float,2:float,3:float} [latMin, latMax, lngMin, lngMax]
     */
    private function boundingBox(float $lat, float $lng, float $radiusKm): array
    {
        $latDelta = $radiusKm / 111.0;
        $lngDelta = $radiusKm / (111.0 * max(cos(deg2rad($lat)), 0.01));

        return [$lat - $latDelta, $lat + $latDelta, $lng - $lngDelta, $lng + $lngDelta];
    }
}
