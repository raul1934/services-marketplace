<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A company-owned category for a kind (equipment/consumable) of resource. */
class FieldResourceCategory extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'company_id', 'kind', 'name', 'position'];

    protected $casts = [
        'position' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(FieldCompany::class, 'company_id');
    }

    public function resources(): BelongsToMany
    {
        return $this->belongsToMany(FieldResource::class, 'field_resource_category', 'category_id', 'resource_id');
    }
}
