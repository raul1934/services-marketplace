<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class City extends Model
{
    protected $fillable = ['state_id', 'name', 'ibge_id'];

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    /** country_id lives on the state; expose the country through it. */
    public function country(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            Country::class,
            State::class,
            'id',          // states.id
            'id',          // countries.id
            'state_id',    // cities.state_id
            'country_id',  // states.country_id
        );
    }
}
