<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = [
        'category_type', 'service_category_id', 'key', 'text', 'type', 'placeholder', 'options', 'half', 'required', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'text' => 'array',
        'placeholder' => 'array',
        'options' => 'array',
        'half' => 'boolean',
        'required' => 'boolean',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /** Localized question text for the current app locale, falling back to pt. */
    public function localizedText(): ?string
    {
        return $this->loc($this->text);
    }

    public function localizedPlaceholder(): ?string
    {
        return $this->loc($this->placeholder);
    }

    /** @param array<string,string>|null $m */
    public function loc(?array $m): ?string
    {
        if (! $m) {
            return null;
        }

        return $m[app()->getLocale()] ?? $m['pt'] ?? (reset($m) ?: null);
    }
}
