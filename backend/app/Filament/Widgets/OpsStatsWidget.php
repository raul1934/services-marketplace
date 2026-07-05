<?php

namespace App\Filament\Widgets;

use App\Enums\DisputeStatus;
use App\Enums\RequestStatus;
use App\Models\Dispute;
use App\Models\ServiceRequest;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class OpsStatsWidget extends StatsOverviewWidget
{
    protected static ?string $pollingInterval = '5s';

    protected function getStats(): array
    {
        $user = auth()->user();
        $marketIds = $user->isSuperAdmin() ? null : $user->marketIds();

        $requests = ServiceRequest::query()
            ->when($marketIds !== null, fn ($q) => $q->whereIn('market_id', $marketIds));

        $disputes = Dispute::query()
            ->when($marketIds !== null, fn ($q) => $q->whereHas('request', fn ($r) => $r->whereIn('market_id', $marketIds)));

        return [
            Stat::make('Open', (clone $requests)->where('status', RequestStatus::Open->value)->count()),
            Stat::make('In progress', (clone $requests)->whereIn('status', [
                RequestStatus::Accepted->value, RequestStatus::InProgress->value,
            ])->count()),
            Stat::make('Open disputes', (clone $disputes)->where('status', '!=', DisputeStatus::Resolved->value)->count())
                ->color('danger'),
        ];
    }
}
