<?php

namespace App\Filament\Resources;

use App\Filament\Concerns\ScopedToMarkets;
use App\Filament\Resources\WalletTransactionResource\Pages;
use App\Models\WalletTransaction;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Manual payment reconciliation — no real payment gateway exists (see
 * WalletController::payout(), a self-serve Pix withdrawal request). Staff
 * send the actual transfer outside the app, then mark it paid here.
 */
class WalletTransactionResource extends Resource
{
    use ScopedToMarkets;

    protected static ?string $model = WalletTransaction::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Payments';

    protected static function scopeToMarkets(Builder $query, Collection $marketIds): Builder
    {
        return $query->whereIn('market_id', $marketIds);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('provider.name')
                    ->label('Provider')
                    ->searchable(),
                Tables\Columns\TextColumn::make('market.name')
                    ->label('Market'),
                Tables\Columns\TextColumn::make('type')
                    ->badge(),
                Tables\Columns\TextColumn::make('amount')
                    ->money('BRL')
                    ->sortable(),
                Tables\Columns\TextColumn::make('description'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        WalletTransaction::STATUS_PENDING => 'warning',
                        WalletTransaction::STATUS_HELD => 'danger',
                        default => 'success',
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('type')
                    ->options([
                        WalletTransaction::TYPE_PAYOUT => 'Payout',
                        WalletTransaction::TYPE_CREDIT => 'Credit',
                    ])
                    ->default(WalletTransaction::TYPE_PAYOUT),
            ])
            ->actions([
                Tables\Actions\Action::make('markPaid')
                    ->label('Mark as paid')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (WalletTransaction $record): bool => $record->type === WalletTransaction::TYPE_PAYOUT
                        && $record->status === WalletTransaction::STATUS_PENDING)
                    ->action(function (WalletTransaction $record) {
                        $record->update(['status' => WalletTransaction::STATUS_COMPLETED]);
                        Notification::make()->title('Marked as paid')->success()->send();
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWalletTransactions::route('/'),
        ];
    }
}
