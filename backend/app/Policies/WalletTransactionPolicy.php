<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Policies\Concerns\ChecksMarketAccess;

class WalletTransactionPolicy
{
    use ChecksMarketAccess;

    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isMarketAdmin();
    }

    public function view(User $user, WalletTransaction $transaction): bool
    {
        return $this->canAccessMarket($user, $transaction->market_id);
    }

    public function update(User $user, WalletTransaction $transaction): bool
    {
        return $this->canAccessMarket($user, $transaction->market_id);
    }
}
