<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A seeded property type (Apartamento, Casa, …). Reference data for the picker. */
class PropertyType extends Model
{
    protected $fillable = ['name'];
}
