<?php

namespace App\Filament\Resources\RescueContactResource\Pages;

use App\Filament\Resources\RescueContactResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditRescueContact extends EditRecord
{
    protected static string $resource = RescueContactResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
