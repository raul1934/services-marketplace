<?php

namespace App\Policies;

use App\Models\Dispute;
use App\Models\User;
use App\Policies\Concerns\ChecksMarketAccess;

class DisputePolicy
{
    use ChecksMarketAccess;

    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isMarketAdmin();
    }

    public function view(User $user, Dispute $dispute): bool
    {
        return $this->canAccessMarket($user, $dispute->request?->market_id);
    }

    public function update(User $user, Dispute $dispute): bool
    {
        return $this->canAccessMarket($user, $dispute->request?->market_id);
    }
}
