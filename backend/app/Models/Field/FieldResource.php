<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A catalog item a company owns — equipment (billed per visit/hour) or a
 * consumable (free or charged), split by `kind`. Sits in one or more of its
 * company's categories.
 */
class FieldResource extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'company_id', 'kind', 'name', 'rate', 'cost', 'position'];

    protected $casts = [
        'position' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(FieldCompany::class, 'company_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(FieldResourceCategory::class, 'field_resource_category', 'resource_id', 'category_id');
    }
}
