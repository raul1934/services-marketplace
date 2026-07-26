<?php

namespace App\Models\Field;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A serviced site (condomínio/edifício). Master data — no execution state. */
class FieldSite extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'contract', 'company_id', 'address', 'lat', 'lng', 'geofence'];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'geofence' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(FieldCompany::class, 'company_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(FieldService::class, 'site_id')->orderBy('position');
    }

    /** Every visit this site has received — its history is derived from these. */
    public function performances(): HasMany
    {
        return $this->hasMany(FieldSitePerformance::class, 'site_id')->latest('id');
    }
}
