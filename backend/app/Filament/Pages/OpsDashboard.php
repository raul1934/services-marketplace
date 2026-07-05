<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\OpsStatsWidget;
use App\Models\ServiceRequest;
use Filament\Pages\Dashboard;
use Filament\Tables;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;

/**
 * Default landing page: open/in-progress requests across the admin's
 * market(s) (all markets for a Super Admin), refreshed via Livewire polling
 * — no websocket/Echo wiring needed for this to feel "live enough". The map
 * lives on its own page now — see App\Filament\Pages\LiveMap.
 */
class OpsDashboard extends Dashboard implements HasTable
{
    use InteractsWithTable;

    protected static string $view = 'filament.pages.ops-dashboard';

    public function getWidgets(): array
    {
        return [OpsStatsWidget::class];
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(ServiceRequest::activeInMarketScope(auth()->user()))
            ->poll('5s')
            ->columns([
                Tables\Columns\TextColumn::make('id'),
                Tables\Columns\TextColumn::make('market.name')->label('Market'),
                Tables\Columns\TextColumn::make('client.name')->label('Client'),
                Tables\Columns\TextColumn::make('category.name')->label('Category'),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('created_at')->since()->label('Opened')->sortable(),
            ])
            // Grouped by market so "requests for each geofence" reads as
            // separate sections rather than one flat, mixed list.
            ->defaultGroup('market.name')
            ->groupingSettingsHidden()
            ->defaultSort('created_at', 'desc');
    }
}
