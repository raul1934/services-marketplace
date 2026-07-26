<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A service a site requires — mandatory (obrig) on every visit or optional.
 * Definition only: whether it was actually done lives on a ServicePerformance.
 * `req_equipment` / `req_consumable` are flags (a message: this service needs
 * equipment and/or a consumable) — not a link to a specific catalog item.
 */
class FieldService extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'site_id', 'name', 'who', 'who_name', 'rate', 'obrig', 'req_equipment', 'req_consumable', 'nest', 'position'];

    protected $casts = [
        'obrig' => 'boolean',
        'req_equipment' => 'boolean',
        'req_consumable' => 'boolean',
        'nest' => 'array',
        'position' => 'integer',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(FieldSite::class, 'site_id');
    }
}
