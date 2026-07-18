<?php

namespace App\Filament\Resources;

use App\Enums\SocialPostStatus;
use App\Enums\SocialTargetStatus;
use App\Filament\Resources\SocialPostResource\Pages;
use App\Jobs\PollSocialInteractions;
use App\Models\SocialConnection;
use App\Models\SocialPost;
use App\Services\Social\SocialPublishing;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * Compose a post and publish it to the connected Facebook / Instagram accounts,
 * immediately or scheduled. Super-Admin only. The "Publicar agora" action
 * delegates to SocialPublishing (like DisputeResource → DisputeService); the
 * scheduled path is picked up by the social:publish-due command.
 */
class SocialPostResource extends Resource
{
    protected static ?string $model = SocialPost::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationGroup = 'Social';

    protected static ?string $navigationLabel = 'Posts';

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->isSuperAdmin();
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Textarea::make('caption')
                    ->required()
                    ->rows(5)
                    ->maxLength(2200) // IG caption ceiling; FB is looser
                    ->columnSpanFull(),
                // Stored as polymorphic Media (tag 'social') by the page hooks,
                // not a column on social_posts. Instagram needs an image.
                Forms\Components\FileUpload::make('image_upload')
                    ->label('Image')
                    ->image()
                    ->disk('public')
                    ->directory('uploads/social')
                    ->visibility('public')
                    ->helperText('Required for Instagram. Facebook can post text only.'),
                Forms\Components\CheckboxList::make('connection_ids')
                    ->label('Publish to')
                    ->options(fn (): array => SocialConnection::where('is_active', true)
                        ->get()
                        ->mapWithKeys(fn (SocialConnection $c) => [$c->id => $c->provider->label().' — '.$c->name])
                        ->all())
                    ->required()
                    ->columns(2)
                    ->helperText('Only active connections are listed.'),
                Forms\Components\DateTimePicker::make('scheduled_at')
                    ->label('Schedule for')
                    ->helperText('Leave empty to publish now (use the "Publicar agora" action after saving).')
                    ->minDate(now()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with('targets'))
            ->columns([
                Tables\Columns\TextColumn::make('caption')
                    ->wrap()
                    ->limit(60),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (SocialPostStatus $state): string => match ($state) {
                        SocialPostStatus::Draft => 'gray',
                        SocialPostStatus::Scheduled => 'info',
                        SocialPostStatus::Publishing => 'warning',
                        SocialPostStatus::Published => 'success',
                        SocialPostStatus::Partial => 'warning',
                        SocialPostStatus::Failed => 'danger',
                    }),
                Tables\Columns\TextColumn::make('targets')
                    ->label('Targets')
                    ->badge()
                    ->getStateUsing(fn (SocialPost $record): array => $record->targets
                        ->map(fn ($t) => strtoupper(substr($t->provider->value, 0, 2)).' · '.$t->status->value)
                        ->all())
                    ->color(fn (string $state): string => match (true) {
                        str_contains($state, SocialTargetStatus::Published->value) => 'success',
                        str_contains($state, SocialTargetStatus::Failed->value) => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('likes')
                    ->label('Likes')
                    ->getStateUsing(fn (SocialPost $record): int => (int) $record->targets->sum('likes_count')),
                Tables\Columns\TextColumn::make('comments')
                    ->label('Comments')
                    ->getStateUsing(fn (SocialPost $record): int => (int) $record->targets->sum('comments_count')),
                Tables\Columns\TextColumn::make('scheduled_at')
                    ->dateTime()
                    ->placeholder('—')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(collect(SocialPostStatus::cases())->mapWithKeys(fn ($s) => [$s->value => $s->name])),
            ])
            ->actions([
                Tables\Actions\Action::make('publishNow')
                    ->label('Publicar agora')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (SocialPost $record): bool => in_array($record->status, [
                        SocialPostStatus::Draft, SocialPostStatus::Scheduled, SocialPostStatus::Failed,
                    ], true) && $record->targets()->exists())
                    ->action(function (SocialPost $record): void {
                        app(SocialPublishing::class)->publishNow($record);
                        Notification::make()->title('Publicação enviada para processamento.')->success()->send();
                    }),
                Tables\Actions\Action::make('refreshInteractions')
                    ->label('Atualizar interações')
                    ->icon('heroicon-o-arrow-path')
                    ->color('gray')
                    ->visible(fn (SocialPost $record): bool => $record->targets()
                        ->where('status', SocialTargetStatus::Published->value)->exists())
                    ->action(function (SocialPost $record): void {
                        $record->targets()
                            ->where('status', SocialTargetStatus::Published->value)
                            ->whereNotNull('external_id')
                            ->get()
                            ->each(fn ($t) => PollSocialInteractions::dispatch($t->id));
                        Notification::make()->title('Atualização de interações enfileirada.')->success()->send();
                    }),
                Tables\Actions\Action::make('metrics')
                    ->label('Interações')
                    ->icon('heroicon-o-chart-bar')
                    ->color('gray')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Fechar')
                    ->infolist([
                        RepeatableEntry::make('targets')
                            ->label('Per-platform')
                            ->schema([
                                TextEntry::make('provider')
                                    ->badge()
                                    ->formatStateUsing(fn ($state): string => $state->label()),
                                TextEntry::make('status')->badge(),
                                TextEntry::make('likes_count')->label('Likes'),
                                TextEntry::make('comments_count')->label('Comments'),
                                TextEntry::make('permalink')
                                    ->placeholder('—')
                                    ->url(fn ($state) => $state, shouldOpenInNewTab: true),
                                TextEntry::make('error')
                                    ->placeholder('—')
                                    ->color('danger'),
                                TextEntry::make('metrics_refreshed_at')
                                    ->label('Refreshed')
                                    ->dateTime()
                                    ->placeholder('never'),
                                RepeatableEntry::make('comments')
                                    ->label('Comments')
                                    ->schema([
                                        TextEntry::make('author_name')->label('Author')->placeholder('—'),
                                        TextEntry::make('text')->columnSpan(2),
                                        TextEntry::make('posted_at')->dateTime()->placeholder('—'),
                                    ])
                                    ->columns(4)
                                    ->columnSpanFull(),
                            ])
                            ->columns(3),
                    ]),
                Tables\Actions\EditAction::make()
                    ->visible(fn (SocialPost $record): bool => in_array($record->status, [
                        SocialPostStatus::Draft, SocialPostStatus::Scheduled, SocialPostStatus::Failed,
                    ], true)),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSocialPosts::route('/'),
            'create' => Pages\CreateSocialPost::route('/create'),
            'edit' => Pages\EditSocialPost::route('/{record}/edit'),
        ];
    }
}
