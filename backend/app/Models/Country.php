<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = ['name', 'iso2', 'iso3', 'dial_code'];

    public function states(): HasMany
    {
        return $this->hasMany(State::class);
    }

    public function cities(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(City::class, State::class);
    }
}
