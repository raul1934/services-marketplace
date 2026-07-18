<?php

namespace App\Filament\Resources;

use App\Enums\SocialProvider;
use App\Filament\Resources\SocialConnectionResource\Pages;
use App\Models\SocialConnection;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Connected Facebook Pages / Instagram accounts to publish to. Super-Admin only.
 * The access_token is pasted here (a long-lived token) and stored encrypted via
 * the model's `encrypted` cast — it is never rendered in the table and the edit
 * form only overwrites it when a new value is typed.
 */
class SocialConnectionResource extends Resource
{
    protected static ?string $model = SocialConnection::class;

    protected static ?string $navigationIcon = 'heroicon-o-link';

    protected static ?string $navigationGroup = 'Social';

    protected static ?string $navigationLabel = 'Conexões';

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->isSuperAdmin();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('provider')
                    ->options(collect(SocialProvider::cases())->mapWithKeys(fn ($p) => [$p->value => $p->label()]))
                    ->required(),
                Forms\Components\TextInput::make('external_id')
                    ->label('Page ID / IG User ID')
                    ->required()
                    ->maxLength(255)
                    ->helperText('Facebook Page id, or Instagram Business user id.'),
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('access_token')
                    ->label('Long-lived access token')
                    ->password()
                    ->revealable()
                    ->required(fn (string $operation): bool => $operation === 'create')
                    // Encrypted at rest; only overwrite when a new token is typed
                    // (leaving it blank on edit keeps the stored one).
                    ->dehydrated(fn (?string $state): bool => filled($state))
                    ->helperText('Pasted once. Leave blank on edit to keep the current token.'),
                Forms\Components\DateTimePicker::make('token_expires_at')
                    ->label('Token expires at')
                    ->helperText('Optional — for your own reference; long-lived tokens last ~60 days.'),
                Forms\Components\Toggle::make('is_active')
                    ->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('provider')
                    ->badge()
                    ->formatStateUsing(fn (SocialProvider $state): string => $state->label())
                    ->color(fn (SocialProvider $state): string => match ($state) {
                        SocialProvider::Facebook => 'info',
                        SocialProvider::Instagram => 'warning',
                    }),
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('external_id')
                    ->label('Page / IG id')
                    ->searchable(),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
                Tables\Columns\TextColumn::make('token_expires_at')
                    ->dateTime()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
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
            'index' => Pages\ListSocialConnections::route('/'),
            'create' => Pages\CreateSocialConnection::route('/create'),
            'edit' => Pages\EditSocialConnection::route('/{record}/edit'),
        ];
    }
}
