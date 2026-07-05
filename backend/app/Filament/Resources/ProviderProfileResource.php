<?php

namespace App\Filament\Resources;

use App\Filament\Concerns\ScopedToMarkets;
use App\Filament\Resources\ProviderProfileResource\Pages;
use App\Filament\Resources\ProviderProfileResource\RelationManagers\DocumentsRelationManager;
use App\Models\ProviderProfile;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Back-office reputation view (human-driven, not automated): an admin can see
 * a provider's rating/no-show history and manually suspend them by flipping
 * is_approved/is_online — there's no automatic scoring or suspension rule.
 * Also where provider applications (verification documents) get reviewed —
 * see DocumentsRelationManager.
 */
class ProviderProfileResource extends Resource
{
    use ScopedToMarkets;

    protected static ?string $model = ProviderProfile::class;

    protected static ?string $navigationIcon = 'heroicon-o-shield-check';

    protected static ?string $navigationLabel = 'Providers (reputation)';

    protected static function scopeToMarkets(Builder $query, Collection $marketIds): Builder
    {
        return $query->whereIn('market_id', $marketIds);
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->disabled()
                    ->required(),
                Forms\Components\TextInput::make('company_name')
                    ->maxLength(255),
                Forms\Components\Toggle::make('is_online')
                    ->label('Online'),
                Forms\Components\Toggle::make('is_approved')
                    ->label('Approved (uncheck to suspend)'),
                Forms\Components\TextInput::make('rating_avg')
                    ->numeric()
                    ->disabled(),
                Forms\Components\TextInput::make('rating_count')
                    ->numeric()
                    ->disabled(),
                Forms\Components\TextInput::make('jobs_completed')
                    ->numeric()
                    ->disabled(),
                Forms\Components\TextInput::make('no_show_count')
                    ->numeric()
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable(),
                Tables\Columns\TextColumn::make('market.name')
                    ->label('Market')
                    ->sortable(),
                Tables\Columns\TextColumn::make('rating_avg')
                    ->label('Rating')
                    ->numeric(2)
                    ->sortable(),
                Tables\Columns\TextColumn::make('jobs_completed')
                    ->label('Jobs')
                    ->sortable(),
                Tables\Columns\TextColumn::make('no_show_count')
                    ->label('No-shows')
                    ->sortable()
                    ->color(fn (int $state): string => $state > 0 ? 'danger' : 'gray'),
                Tables\Columns\IconColumn::make('is_online')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_approved')
                    ->boolean(),
            ])
            ->defaultSort('no_show_count', 'desc')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_approved'),
                SelectFilter::make('market_id')
                    ->label('Market')
                    ->relationship('market', 'name'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            DocumentsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProviderProfiles::route('/'),
            'edit' => Pages\EditProviderProfile::route('/{record}/edit'),
        ];
    }
}
