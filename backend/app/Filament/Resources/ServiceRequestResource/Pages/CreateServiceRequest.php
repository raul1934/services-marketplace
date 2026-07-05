<?php

namespace App\Filament\Resources\ServiceRequestResource\Pages;

use App\Filament\Resources\ServiceRequestResource;
use App\Jobs\DispatchNewRequestToProviders;
use App\Services\MatchingService;
use Filament\Resources\Pages\CreateRecord;

class CreateServiceRequest extends CreateRecord
{
    protected static string $resource = ServiceRequestResource::class;

    /** Same automatic market assignment as a customer-created request (see RequestService::create()). */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $market = app(MatchingService::class)->marketFor((float) $data['latitude'], (float) $data['longitude']);
        $data['market_id'] = $market?->id;

        return $data;
    }

    /** Admin-created requests need the same provider fan-out as customer-created ones. */
    protected function afterCreate(): void
    {
        DispatchNewRequestToProviders::dispatch($this->record->id);
    }
}
