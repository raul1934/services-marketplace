<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A company that owns field catalogs (equipment/consumable) and services sites. */
class FieldCompany extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name'];

    public function sites(): HasMany
    {
        return $this->hasMany(FieldSite::class, 'company_id');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(FieldResource::class, 'company_id')->orderBy('position');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(FieldResourceCategory::class, 'company_id')->orderBy('position');
    }
}
