<?php

namespace App\Filament\Resources\SocialConnectionResource\Pages;

use App\Filament\Resources\SocialConnectionResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSocialConnections extends ListRecords
{
    protected static string $resource = SocialConnectionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
