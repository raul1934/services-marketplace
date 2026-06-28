<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A seeded pet breed, belonging to a species. */
class PetBreed extends Model
{
    protected $fillable = ['pet_species_id', 'name'];

    public function species(): BelongsTo
    {
        return $this->belongsTo(PetSpecies::class, 'pet_species_id');
    }
}
