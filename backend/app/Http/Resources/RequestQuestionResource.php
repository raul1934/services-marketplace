<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_request_id' => $this->service_request_id,
            'provider_id' => $this->provider_id,
            'provider_name' => $this->whenLoaded('provider', fn () => $this->provider->name),
            // TEMP (test bots): derived rather than stored — the thread already
            // eager-loads `provider`, so there's no extra query. Remove with app/Bots.
            'is_test' => $this->whenLoaded('provider', fn () => (bool) $this->provider->is_bot),
            'suggestion_id' => $this->suggestion_id,
            'question' => $this->question,
            'answer' => $this->answer,
            'image_required' => $this->image_required,
            'answer_photos' => $this->whenLoaded('answerPhotos', fn () => $this->answerPhotos->pluck('url')),
            'answered' => $this->answered_at !== null,
            'answered_at' => $this->answered_at,
            'created_at' => $this->created_at,
        ];
    }
}
