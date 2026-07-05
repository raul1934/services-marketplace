<?php

namespace App\Filament\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * List-level market scoping for admin-facing Resources. A Super Admin sees
 * everything; a Market Admin only sees rows in their assigned market(s) (see
 * User::marketIds()) — an admin assigned to zero markets sees zero rows, not
 * an error. This only protects list/table views; pair with a Policy for
 * record-level checks (direct edit/view URLs), see app/Policies.
 */
trait ScopedToMarkets
{
    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = auth()->user();

        if (! $user || $user->isSuperAdmin()) {
            return $query;
        }

        return static::scopeToMarkets($query, $user->marketIds());
    }

    /** @param  Collection<int, int>  $marketIds */
    abstract protected static function scopeToMarkets(Builder $query, Collection $marketIds): Builder;
}
