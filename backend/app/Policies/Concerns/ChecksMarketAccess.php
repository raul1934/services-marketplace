<?php

namespace App\Policies\Concerns;

use App\Models\User;

/**
 * Shared record-level market check for admin policies. A Super Admin can act
 * on anything; a Market Admin only on records whose market_id is one of
 * theirs (see User::marketIds()). $marketId is null for an unassigned
 * record — invisible to every Market Admin, visible only to a Super Admin.
 */
trait ChecksMarketAccess
{
    protected function canAccessMarket(User $user, ?int $marketId): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $marketId !== null && $user->marketIds()->contains($marketId);
    }
}
