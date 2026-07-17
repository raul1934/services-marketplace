<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A part an asset can be broken into (sala, telhado, piscina). Reference data
 * for the suggestion chips — it suggests, it never restricts: `asset_parts.name`
 * remains free text.
 */
class PartType extends Model
{
    protected $fillable = ['name', 'slug', 'position'];

    /** @return BelongsToMany<PropertyType, $this> */
    public function propertyTypes(): BelongsToMany
    {
        return $this->belongsToMany(PropertyType::class)->withPivot('default_selected');
    }
}
