<?php

namespace App\Filament\Resources\SocialPostResource\Pages;

use App\Enums\SocialPostStatus;
use App\Filament\Resources\SocialPostResource;
use App\Services\MediaService;
use App\Services\Social\SocialPublishing;
use Filament\Resources\Pages\CreateRecord;

class CreateSocialPost extends CreateRecord
{
    protected static string $resource = SocialPostResource::class;

    /** @var array<int, string|int> */
    protected array $connectionIds = [];

    protected ?string $imagePath = null;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // image_upload / connection_ids are form-only fields (not columns) —
        // pull them out and materialize them in afterCreate().
        $this->imagePath = $data['image_upload'] ?? null;
        $this->connectionIds = $data['connection_ids'] ?? [];
        unset($data['image_upload'], $data['connection_ids']);

        $data['created_by'] = auth()->id();
        $data['status'] = ! empty($data['scheduled_at'])
            ? SocialPostStatus::Scheduled->value
            : SocialPostStatus::Draft->value;

        return $data;
    }

    protected function afterCreate(): void
    {
        if ($this->imagePath) {
            app(MediaService::class)->fromPath($this->imagePath, $this->record, 'social', auth()->id());
        }

        app(SocialPublishing::class)->syncTargets($this->record, $this->connectionIds);
    }
}
