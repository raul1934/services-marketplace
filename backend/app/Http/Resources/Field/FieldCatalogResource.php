<?php

namespace App\Http\Resources\Field;

use App\Models\Field\FieldCatalogItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FieldCatalogItem */
class FieldCatalogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'rate' => $this->rate,
            'obrig' => (bool) $this->obrig,
        ];
    }
}
