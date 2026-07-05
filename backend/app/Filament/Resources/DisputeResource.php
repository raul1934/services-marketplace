<?php

namespace App\Filament\Resources;

use App\Enums\DisputeStatus;
use App\Filament\Concerns\ScopedToMarkets;
use App\Filament\Resources\DisputeResource\Pages;
use App\Models\Dispute;
use App\Services\DisputeService;
use Filament\Forms;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Back-office mediation queue. Resolving here calls the existing
 * DisputeService::resolve() (already releases the held wallet split and
 * notifies both parties) — no new business logic, just wiring a Filament
 * action to what's already there.
 */
class DisputeResource extends Resource
{
    use ScopedToMarkets;

    protected static ?string $model = Dispute::class;

    protected static ?string $navigationIcon = 'heroicon-o-scale';

    protected static function scopeToMarkets(Builder $query, Collection $marketIds): Builder
    {
        return $query->whereHas('request', fn (Builder $q) => $q->whereIn('market_id', $marketIds));
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('service_request_id')
                    ->label('Request')
                    ->sortable(),
                Tables\Columns\TextColumn::make('request.market.name')
                    ->label('Market'),
                Tables\Columns\TextColumn::make('openedBy.name')
                    ->label('Opened by'),
                Tables\Columns\TextColumn::make('claim')
                    ->wrap()
                    ->limit(80),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (DisputeStatus $state): string => match ($state) {
                        DisputeStatus::Open => 'danger',
                        DisputeStatus::UnderReview => 'warning',
                        DisputeStatus::Resolved => 'success',
                    }),
                Tables\Columns\TextColumn::make('resolved_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options(collect(DisputeStatus::cases())->mapWithKeys(fn ($s) => [$s->value => $s->name])),
            ])
            ->actions([
                Tables\Actions\Action::make('evidence')
                    ->label('View evidence')
                    ->color('gray')
                    ->infolist([
                        TextEntry::make('claim')->label('Client claim'),
                        RepeatableEntry::make('evidence')
                            ->label('Evidence')
                            ->schema([
                                TextEntry::make('party'),
                                TextEntry::make('text'),
                            ]),
                    ])
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close'),
                Tables\Actions\Action::make('resolve')
                    ->color('success')
                    ->visible(fn (Dispute $record): bool => $record->status !== DisputeStatus::Resolved)
                    ->form([
                        Forms\Components\Textarea::make('resolution')
                            ->label('Resolution (sent to both parties)')
                            ->required(),
                    ])
                    ->action(fn (Dispute $record, array $data) => app(DisputeService::class)->resolve($record, $data['resolution'])),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDisputes::route('/'),
        ];
    }
}
