<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;
use App\Policies\Concerns\ChecksMarketAccess;

class ServiceRequestPolicy
{
    use ChecksMarketAccess;

    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isMarketAdmin();
    }

    public function view(User $user, ServiceRequest $request): bool
    {
        return $this->canAccessMarket($user, $request->market_id);
    }

    public function update(User $user, ServiceRequest $request): bool
    {
        return $this->canAccessMarket($user, $request->market_id);
    }

    public function delete(User $user, ServiceRequest $request): bool
    {
        return $user->isSuperAdmin();
    }
}
