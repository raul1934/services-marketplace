<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/** Pet characteristics for an asset (the `detailable` of a pet asset). */
class AssetPet extends Model
{
    protected $fillable = ['pet_species_id', 'pet_breed_id', 'size', 'birthdate', 'weight', 'vaccines', 'microchip'];

    public function asset(): MorphOne
    {
        return $this->morphOne(Asset::class, 'detailable');
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(PetSpecies::class, 'pet_species_id');
    }

    public function breed(): BelongsTo
    {
        return $this->belongsTo(PetBreed::class, 'pet_breed_id');
    }
}
