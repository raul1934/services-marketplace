<?php

namespace App\Services;

use App\Enums\AvailabilityType;
use App\Models\User;

class ProviderAvailabilityService
{
    /**
     * Set how the provider is available: 24h ("always") or weekly windows.
     *
     * @param  array<array{weekday:string,start_time:string,end_time:string}>  $windows
     */
    public function set(User $user, AvailabilityType $type, array $windows = []): void
    {
        $user->providerProfile->update(['availability_type' => $type->value]);
        $user->availabilities()->delete();

        if ($type === AvailabilityType::Scheduled) {
            foreach ($windows as $w) {
                $user->availabilities()->create([
                    'weekday' => $w['weekday'],
                    'start_time' => $w['start_time'],
                    'end_time' => $w['end_time'],
                ]);
            }
        }
    }

    /** Whether the provider's declared hours cover the current moment. */
    public function isAvailableNow(User $user): bool
    {
        $profile = $user->providerProfile;
        if (! $profile) {
            return false;
        }
        if ($profile->availability_type === AvailabilityType::Always) {
            return true;
        }

        $now = now();
        $weekday = strtolower($now->format('D')); // mon, tue, ...
        $time = $now->format('H:i:s');

        return $user->availabilities()
            ->where('weekday', $weekday)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->exists();
    }
}
