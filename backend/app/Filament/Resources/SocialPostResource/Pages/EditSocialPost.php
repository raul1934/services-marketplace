<?php

namespace App\Filament\Resources\SocialPostResource\Pages;

use App\Enums\SocialPostStatus;
use App\Filament\Resources\SocialPostResource;
use App\Services\MediaService;
use App\Services\Social\SocialPublishing;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSocialPost extends EditRecord
{
    protected static string $resource = SocialPostResource::class;

    /** @var array<int, string|int> */
    protected array $connectionIds = [];

    protected ?string $imagePath = null;

    protected bool $imageTouched = false;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $data['connection_ids'] = $this->record->targets()->pluck('social_connection_id')->all();
        $data['image_upload'] = $this->record->image?->path;

        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $this->imageTouched = array_key_exists('image_upload', $data);
        $this->imagePath = $data['image_upload'] ?? null;
        $this->connectionIds = $data['connection_ids'] ?? [];
        unset($data['image_upload'], $data['connection_ids']);

        // Only recompute status while the post hasn't gone out yet.
        if (in_array($this->record->status, [SocialPostStatus::Draft, SocialPostStatus::Scheduled, SocialPostStatus::Failed], true)) {
            $data['status'] = ! empty($data['scheduled_at'])
                ? SocialPostStatus::Scheduled->value
                : SocialPostStatus::Draft->value;
        }

        return $data;
    }

    protected function afterSave(): void
    {
        if ($this->imageTouched) {
            $existing = $this->record->image;

            if ($this->imagePath && $existing?->path !== $this->imagePath) {
                $existing?->delete();
                app(MediaService::class)->fromPath($this->imagePath, $this->record, 'social', auth()->id());
            } elseif (! $this->imagePath && $existing) {
                $existing->delete();
            }
        }

        app(SocialPublishing::class)->syncTargets($this->record, $this->connectionIds);
    }
}
