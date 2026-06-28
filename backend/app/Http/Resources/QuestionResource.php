<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** An intake question, with text localized to the request locale (X-Locale). */
class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'type' => $this->type,
            'label' => $this->localizedText(),
            'placeholder' => $this->localizedPlaceholder(),
            'required' => (bool) $this->required,
            'half' => (bool) $this->half,
            'options' => $this->options
                ? array_map(fn (array $o) => ['value' => $o['value'], 'label' => $this->loc($o['text'] ?? null)], $this->options)
                : null,
        ];
    }
}
