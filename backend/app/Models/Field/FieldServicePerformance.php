<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Whether a given service was done on a given site visit. */
class FieldServicePerformance extends Model
{
    protected $fillable = ['site_performance_id', 'service_id', 'done'];

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
}
