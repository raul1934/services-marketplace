<?php

namespace App\Filament\Resources;

use App\Enums\RequestStatus;
use App\Filament\Concerns\ScopedToMarkets;
use App\Filament\Resources\ServiceRequestResource\Pages;
use App\Models\ServiceRequest;
use App\Support\LucideIcon;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ServiceRequestResource extends Resource
{
    use ScopedToMarkets;

    protected static ?string $model = ServiceRequest::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static function scopeToMarkets(Builder $query, Collection $marketIds): Builder
    {
        return $query->whereIn('market_id', $marketIds);
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('client_id')
                    ->relationship('client', 'name')
                    ->required(),
                Forms\Components\TextInput::make('service_category_id')
                    ->required()
                    ->numeric(),
                Forms\Components\Select::make('accepted_proposal_id')
                    ->relationship('acceptedProposal', 'id'),
                Forms\Components\TextInput::make('accepted_provider_id')
                    ->numeric(),
                Forms\Components\Textarea::make('description')
                    ->required()
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('latitude')
                    ->required()
                    ->numeric(),
                Forms\Components\TextInput::make('longitude')
                    ->required()
                    ->numeric(),
                Forms\Components\TextInput::make('address')
                    ->maxLength(255),
                Forms\Components\TextInput::make('budget_max')
                    ->numeric(),
                Forms\Components\TextInput::make('status')
                    ->required()
                    ->maxLength(255)
                    ->default('open'),
                Forms\Components\TextInput::make('cancelled_reason')
                    ->maxLength(255),
                Forms\Components\DateTimePicker::make('accepted_at'),
                Forms\Components\DateTimePicker::make('started_at'),
                Forms\Components\DateTimePicker::make('completed_at'),
                Forms\Components\DateTimePicker::make('cancelled_at'),
                Forms\Components\TextInput::make('urgency')
                    ->required()
                    ->maxLength(255)
                    ->default('urgent'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('client.name')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('market.name')
                    ->label('Market')
                    ->sortable(),
                Tables\Columns\ViewColumn::make('category_icon')
                    ->label('')
                    ->view('filament.tables.columns.icon-svg')
                    ->getStateUsing(fn (ServiceRequest $record): ?string => LucideIcon::svg($record->category?->icon)),
                Tables\Columns\TextColumn::make('category.name')
                    ->label('Category')
                    ->sortable(),
                Tables\Columns\TextColumn::make('acceptedProposal.id')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('accepted_provider_id')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('address')
                    ->searchable(),
                Tables\Columns\TextColumn::make('budget_max')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->searchable(),
                Tables\Columns\TextColumn::make('cancelled_reason')
                    ->searchable(),
                Tables\Columns\TextColumn::make('accepted_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('started_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('completed_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('cancelled_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('urgency')
                    ->searchable(),
            ])
            ->filters([
                SelectFilter::make('market_id')
                    ->label('Market')
                    ->relationship('market', 'name'),
                SelectFilter::make('status')
                    ->options(collect(RequestStatus::cases())->mapWithKeys(fn ($s) => [$s->value => $s->name])),
            ])
            ->actions([
                Tables\Actions\Action::make('map')
                    ->label('Map')
                    ->icon('heroicon-o-map-pin')
                    ->color('gray')
                    ->modalHeading(fn (ServiceRequest $record): string => "Request #{$record->id}")
                    ->modalContent(fn (ServiceRequest $record) => view('filament.tables.actions.request-map', [
                        'record' => [
                            'id' => $record->id,
                            'lat' => $record->latitude,
                            'lng' => $record->longitude,
                            'status' => $record->status->value,
                            'icon' => $record->category?->icon,
                            'label' => $record->client?->name,
                        ],
                        'icons' => LucideIcon::svgMap([$record->category?->icon, 'truck', 'user']),
                    ]))
                    ->modalSubmitAction(false)
                    ->modalCancelAction(false)
                    ->modalWidth('lg'),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListServiceRequests::route('/'),
            'create' => Pages\CreateServiceRequest::route('/create'),
            'edit' => Pages\EditServiceRequest::route('/{record}/edit'),
        ];
    }
}
