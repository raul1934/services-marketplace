<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

/**
 * Click-to-draw polygon boundary editor (Market.geofence) — an array of
 * {latitude, longitude} points, same shape as AssetProperty's geofence.
 * Renders its own Leaflet map and syncs via $wire.$entangle(), matching how
 * Filament's own KeyValue field manages a fully JS-owned widget.
 */
class GeofenceMapInput extends Field
{
    protected string $view = 'filament.forms.components.geofence-map-input';
}
