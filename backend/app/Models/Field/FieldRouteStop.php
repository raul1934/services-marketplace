<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One ordered stop on a route template — a site at a given distance. */
class FieldRouteStop extends Model
{
    protected $fillable = ['route_id', 'site_id', 'km', 'position'];

    protected $casts = [
        'position' => 'integer',
    ];

    public function route(): BelongsTo
    {
        return $this->belongsTo(FieldRoute::class, 'route_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(FieldSite::class, 'site_id');
    }
}
