<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A seeded pet species (Cão, Gato, …) with its breeds. */
class PetSpecies extends Model
{
    protected $table = 'pet_species';

    protected $fillable = ['name'];

    public function breeds(): HasMany
    {
        return $this->hasMany(PetBreed::class)->orderBy('name');
    }
}
