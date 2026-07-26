<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A route template: an ordered list of site stops. Master data — no status. */
class FieldRoute extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'km'];

    protected $casts = [
        'km' => 'float',
    ];

    public function stops(): HasMany
    {
        return $this->hasMany(FieldRouteStop::class, 'route_id')->orderBy('position');
    }
}
