<?php

namespace App\Policies;

use App\Models\ProviderProfile;
use App\Models\User;
use App\Policies\Concerns\ChecksMarketAccess;

class ProviderProfilePolicy
{
    use ChecksMarketAccess;

    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isMarketAdmin();
    }

    public function view(User $user, ProviderProfile $profile): bool
    {
        return $this->canAccessMarket($user, $profile->market_id);
    }

    public function update(User $user, ProviderProfile $profile): bool
    {
        return $this->canAccessMarket($user, $profile->market_id);
    }

    public function delete(User $user, ProviderProfile $profile): bool
    {
        return $user->isSuperAdmin();
    }
}
