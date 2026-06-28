<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/** A seeded vehicle make (brand). Reference data for the asset make/model picker. */
class VehicleMake extends Model
{
    protected $fillable = ['name', 'logo_path'];

    public function models(): HasMany
    {
        return $this->hasMany(VehicleModel::class)->orderBy('name');
    }

    /** Absolute logo URL (the seed may store a CDN URL or a public-disk path). */
    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        return Str::startsWith($this->logo_path, 'http')
            ? $this->logo_path
            : Storage::disk('public')->url($this->logo_path);
    }
}
