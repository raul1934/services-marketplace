<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Whether a given service was done on a given site visit — plus, on the visit,
 * who did it (assignee) and which catalog resources were used (resources()).
 */
class FieldServicePerformance extends Model
{
    protected $fillable = ['site_performance_id', 'service_id', 'assignee', 'assignee_name', 'done'];

    protected $casts = [
        'done' => 'boolean',
    ];

    public function sitePerformance(): BelongsTo
    {
        return $this->belongsTo(FieldSitePerformance::class, 'site_performance_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(FieldService::class, 'service_id');
    }

    /** Equipment/consumables recorded as used on this performed service. */
    public function resources(): BelongsToMany
    {
        return $this->belongsToMany(FieldResource::class, 'field_service_performance_resources', 'service_performance_id', 'resource_id')
            ->withPivot('qty', 'minutes', 'site_duration')
            ->withTimestamps();
    }
}
