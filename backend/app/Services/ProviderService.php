<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Events\ProviderLocationUpdated;
use App\Models\ProviderLocation;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\NearbyLocation;

class ProviderService
{
    /** Toggle the provider's availability; optionally seed the current location. */
    public function setOnline(User $user, bool $online, ?array $location = null): void
    {
        $profile = $user->providerProfile;
        $profile->is_online = $online;
        if ($online) {
            $profile->last_online_at = now();
        }
        $profile->save();

        if ($online && $location && isset($location['latitude'], $location['longitude'])) {
            $this->updateLocation($user, $location);
        }
    }

    /** High-write: one row per provider, refreshed by the app's watchPosition. */
    public function updateLocation(User $user, array $location): ProviderLocation
    {
        // In local dev, pin the provider near São José do Rio Preto so two-device
        // testing matches the dev-overridden client requests (scattered around the
        // same city). No-op outside local — the real GPS coordinates win.
        if (app()->environment('local')) {
            $location = array_merge($location, NearbyLocation::random());
        }

        $providerLocation = ProviderLocation::updateOrCreate(
            ['user_id' => $user->id],
            [
                'latitude' => $location['latitude'],
                'longitude' => $location['longitude'],
                'accuracy' => $location['accuracy'] ?? null,
            ],
        );

        // Providers move — recompute which Market (city) they're currently in
        // on every ping, unlike a request's market_id which is fixed at creation.
        $market = app(MatchingService::class)->marketFor((float) $location['latitude'], (float) $location['longitude']);
        $user->providerProfile?->update(['market_id' => $market?->id]);

        // Live tracking: push the new position to every active job's channel.
        ServiceRequest::where('accepted_provider_id', $user->id)
            ->whereIn('status', [RequestStatus::Accepted->value, RequestStatus::InProgress->value])
            ->pluck('id')
            ->each(fn ($id) => ProviderLocationUpdated::dispatch(
                (int) $id,
                (float) $location['latitude'],
                (float) $location['longitude'],
                isset($location['accuracy']) ? (float) $location['accuracy'] : null,
            ));

        return $providerLocation;
    }

    /** @param  array<int>  $categoryIds */
    public function setCategories(User $user, array $categoryIds): void
    {
        $user->categories()->sync($categoryIds);
    }
}
