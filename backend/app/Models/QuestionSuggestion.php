<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A canned pre-bid question a provider can ask the client, scoped to a service
 * category (or category type) and a language. Picked suggestions are copied into
 * request_questions; this row is only referenced for tracking.
 */
class QuestionSuggestion extends Model
{
    protected $fillable = [
        'category_type', 'service_category_id', 'key', 'lang', 'text', 'image_required', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'image_required' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
