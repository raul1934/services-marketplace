<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DisputeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'claim' => $this->claim,
            'resolution' => $this->resolution,
            'opened_by_id' => $this->opened_by_id,
            'evidence' => $this->whenLoaded('evidence', fn () => $this->evidence->map(fn ($e) => [
                'party' => $e->party,
                'text' => $e->text,
                'photos' => $e->relationLoaded('media')
                    ? $e->media->map(fn ($m) => $m->url)->values()
                    : [],
            ])->values()),
            'created_at' => $this->created_at,
            'resolved_at' => $this->resolved_at,
        ];
    }
}
