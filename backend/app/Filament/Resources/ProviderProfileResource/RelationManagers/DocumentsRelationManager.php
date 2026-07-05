<?php

namespace App\Filament\Resources\ProviderProfileResource\RelationManagers;

use App\Notifications\ProviderApplicationApproved;
use App\Notifications\ProviderApplicationRejected;
use Filament\Forms;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

/** Provider verification documents (id/proof_of_address/selfie/certificate) — review queue for provider applications. */
class DocumentsRelationManager extends RelationManager
{
    protected static string $relationship = 'documents';

    /** Uploaded, not yet reviewed; certificate is optional so it isn't required for approval. */
    private const REQUIRED_TYPES = ['id', 'proof_of_address', 'selfie'];

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('type')
            ->columns([
                Tables\Columns\TextColumn::make('type'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('url')
                    ->label('File')
                    ->url(fn ($record) => $record->url)
                    ->openUrlInNewTab()
                    ->formatStateUsing(fn () => 'View'),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->color('success')
                    ->visible(fn ($record) => $record->status !== 'approved')
                    ->action(fn ($record) => $this->decide($record, 'approved')),
                Tables\Actions\Action::make('reject')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->form([
                        Forms\Components\Textarea::make('reason')->label('Reason (sent to the provider)'),
                    ])
                    ->visible(fn ($record) => $record->status !== 'rejected')
                    ->action(fn ($record, array $data) => $this->decide($record, 'rejected', $data['reason'] ?? null)),
            ]);
    }

    private function decide($document, string $status, ?string $reason = null): void
    {
        $document->update(['status' => $status]);
        $profile = $this->getOwnerRecord();
        $user = $profile->user;

        if ($status === 'rejected') {
            $user->notify(new ProviderApplicationRejected($reason));

            return;
        }

        $allApproved = collect(self::REQUIRED_TYPES)->every(
            fn (string $type) => $profile->documents()->where('type', $type)->where('status', 'approved')->exists()
        );

        if ($allApproved && ! $profile->is_approved) {
            $profile->update(['is_approved' => true]);
            $user->notify(new ProviderApplicationApproved);
        }
    }
}
