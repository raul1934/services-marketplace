<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A seeded property type (Apartamento, Casa, …). Reference data for the picker. */
class PropertyType extends Model
{
    protected $fillable = ['name'];

    /** The parts worth suggesting for this kind of place, in display order. */
    public function partTypes(): BelongsToMany
    {
        return $this->belongsToMany(PartType::class)
            ->withPivot('default_selected')
            ->orderBy('part_types.position');
    }
}
