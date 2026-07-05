<?php

namespace App\Filament\Resources;

use App\Enums\AdminRole;
use App\Filament\Forms\Components\GeofenceMapInput;
use App\Filament\Resources\MarketResource\Pages;
use App\Models\Market;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Cities the platform operates in — bounded by a polygon geofence, not a
 * radius (see MatchingService::marketFor()'s point-in-polygon match).
 * Super-Admin only: redrawing a market's boundary changes which Market Admin
 * can see which providers/requests.
 */
class MarketResource extends Resource
{
    protected static ?string $model = Market::class;

    protected static ?string $navigationIcon = 'heroicon-o-map';

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->isSuperAdmin();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Tabs::make('Market')
                    ->columnSpanFull()
                    ->tabs([
                        Forms\Components\Tabs\Tab::make('General')
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                Forms\Components\Toggle::make('is_active')
                                    ->default(true),
                            ]),
                        Forms\Components\Tabs\Tab::make('Boundary')
                            ->schema([
                                GeofenceMapInput::make('geofence')
                                    ->label('Boundary')
                                    ->required()
                                    ->rules(['array', 'min:3'])
                                    ->validationMessages(['min' => 'Draw at least 3 points to close the boundary.']),
                            ]),
                        Forms\Components\Tabs\Tab::make('Admins')
                            ->schema([
                                Forms\Components\Select::make('admins')
                                    ->label('Market Admins')
                                    ->relationship('admins', 'name', fn (Builder $query) => $query->where('role', AdminRole::MarketAdmin->value))
                                    ->multiple()
                                    ->preload()
                                    ->helperText('Only accounts with the Market Admin role show up here — set that on the user first.'),
                            ]),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('geofence')
                    ->label('Boundary points')
                    // formatStateUsing() receives Filament's own raw (uncast)
                    // state resolution for this column, not $record->geofence
                    // — getStateUsing() reads through the Eloquent accessor
                    // instead, so the 'array' cast is guaranteed to apply.
                    ->getStateUsing(fn (Market $record): int => count($record->geofence ?? [])),
                Tables\Columns\TextColumn::make('admins_count')
                    ->label('Admins')
                    ->counts('admins'),
                Tables\Columns\TextColumn::make('requests_count')
                    ->label('Requests')
                    ->counts('requests'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMarkets::route('/'),
            'create' => Pages\CreateMarket::route('/create'),
            'edit' => Pages\EditMarket::route('/{record}/edit'),
        ];
    }
}
