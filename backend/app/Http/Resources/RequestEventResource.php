<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Pass-through resource for the derived request event feed. Each item is already
 * shaped by RequestEventService (id, type, at, amount?, data?); this just lets
 * the controller return a standard `{ data: [...] }` collection envelope.
 */
class RequestEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $event */
        $event = $this->resource;

        return $event;
    }
}
