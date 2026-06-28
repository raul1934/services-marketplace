<?php

namespace App\Models;

use App\Enums\CategoryType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    protected $fillable = ['type', 'slug', 'name', 'icon', 'sort_order', 'is_active'];

    protected $casts = [
        'type' => CategoryType::class,
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function providers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'provider_categories');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    /** Type-level intake questions (fallback for every category of this type). */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'category_type', 'type')
            ->whereNull('service_category_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

    /** Questions specific to this exact category (override/extend the type-level set). */
    public function categoryQuestions(): HasMany
    {
        return $this->hasMany(Question::class, 'service_category_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
}
