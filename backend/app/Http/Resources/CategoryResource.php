<?php

namespace App\Http\Resources;

use App\Enums\AssetType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'asset_type' => AssetType::forCategoryType($this->type->value)?->value,
            'slug' => $this->slug,
            'name' => $this->name,
            'icon' => $this->icon,
            'questions' => QuestionResource::collection($this->mergedQuestions()),
            'sort_order' => $this->sort_order,
        ];
    }

    /**
     * Type-level questions + this category's own questions, with category-specific
     * ones overriding a type-level question that shares its key, ordered by sort.
     */
    private function mergedQuestions(): Collection
    {
        $type = $this->relationLoaded('questions') ? $this->questions : collect();
        $own = $this->relationLoaded('categoryQuestions') ? $this->categoryQuestions : collect();

        $byKey = $type->keyBy('key');
        foreach ($own as $q) {
            $byKey->put($q->key, $q);
        }

        return $byKey->values()->sortBy('sort_order')->values();
    }
}
