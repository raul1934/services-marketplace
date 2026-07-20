<?php

namespace App\Filament\Resources;

use App\Enums\AdminRole;
use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Raw user CRUD — including is_admin and, for admins, their role and market
 * assignment. Deliberately Super-Admin only: this is the one place that can
 * mint another admin account, so a Market Admin must never reach it.
 */
class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->isSuperAdmin();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('email')
                    ->email()
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('phone')
                    ->tel()
                    ->maxLength(255),
                Forms\Components\DateTimePicker::make('email_verified_at'),
                Forms\Components\TextInput::make('password')
                    ->password()
                    ->required()
                    ->maxLength(255),
                Forms\Components\Toggle::make('is_client')
                    ->required(),
                Forms\Components\Toggle::make('is_provider')
                    ->required(),
                Forms\Components\Toggle::make('is_admin')
                    ->required()
                    ->live(),
                Forms\Components\Select::make('role')
                    ->options([
                        AdminRole::SuperAdmin->value => 'Super Admin',
                        AdminRole::MarketAdmin->value => 'Market Admin',
                    ])
                    ->visible(fn (Forms\Get $get): bool => (bool) $get('is_admin'))
                    ->live(),
                Forms\Components\Select::make('markets')
                    ->relationship('markets', 'name')
                    ->multiple()
                    ->preload()
                    ->visible(fn (Forms\Get $get): bool => $get('is_admin') && $get('role') === AdminRole::MarketAdmin->value),
                Forms\Components\TextInput::make('avatar_path')
                    ->maxLength(255),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('email')
                    ->searchable(),
                Tables\Columns\TextColumn::make('phone')
                    ->searchable(),
                Tables\Columns\TextColumn::make('email_verified_at')
                    ->dateTime()
                    ->sortable(),
                Tables\Columns\IconColumn::make('is_client')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_provider')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_admin')
                    ->boolean(),
                Tables\Columns\TextColumn::make('role')
                    ->badge(),
                Tables\Columns\TextColumn::make('avatar_path')
                    ->searchable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                // TEMP (test bots): hide bot accounts by default so they don't
                // clutter the user list. A filter, not a global scope — a scope
                // would also hide them when you're deliberately debugging the
                // bots. Remove with app/Bots.
                Tables\Filters\TernaryFilter::make('is_bot')
                    ->label('Contas de teste')
                    ->placeholder('Ocultar bots')
                    ->trueLabel('Somente bots')
                    ->falseLabel('Somente reais')
                    ->queries(
                        true: fn ($query) => $query->where('is_bot', true),
                        false: fn ($query) => $query->where('is_bot', false),
                        blank: fn ($query) => $query->where('is_bot', false),
                    ),
            ])
            ->actions([
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
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
