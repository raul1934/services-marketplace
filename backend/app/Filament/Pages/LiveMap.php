<?php

namespace App\Filament\Pages;

use App\Models\Market;
use App\Models\ServiceCategory;
use App\Support\LucideIcon;
use Filament\Pages\Page;

/**
 * Standalone live map — split out of the dashboard so it gets full-page room
 * to breathe. Market boundaries render once per page load (rarely edited);
 * request/provider pins refresh on a JS interval hitting MapMarkersController
 * directly (see that class's docblock for why not through Livewire's $wire).
 */
class LiveMap extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-map-pin';

    protected static string $view = 'filament.pages.live-map';

    /** Market boundary polygons — static enough (rarely edited) to render once at page load. */
    public function getMapMarketsProperty(): array
    {
        return Market::activeInScope(auth()->user())
            ->get(['id', 'name', 'geofence'])
            ->filter(fn (Market $m) => count($m->geofence ?? []) >= 3)
            ->map(fn (Market $m) => [
                'id' => $m->id, 'name' => $m->name,
                'points' => collect($m->geofence)->map(fn ($p) => [$p['latitude'], $p['longitude']])->all(),
                'centroid' => $m->centroid(),
            ])
            ->values()
            ->all();
    }

    /**
     * Pre-fetched inline SVG markup for every icon a pin might need, keyed by
     * icon key ('truck' for providers, each category's own icon for
     * customers). Fetched once per page load and handed to Alpine as data —
     * pins then build their divIcon straight from this map with no runtime
     * network call, which is what made zooming/redrawing feel laggy before
     * (every marker recreated on each 5s refresh was fetching its icon image
     * from a remote CDN <img src>).
     */
    public function getIconsProperty(): array
    {
        $categoryIcons = ServiceCategory::query()->pluck('icon');

        return LucideIcon::svgMap([...$categoryIcons, 'truck', 'user']);
    }

    /** Category filter checklist — id/name/icon, all checked by default. */
    public function getCategoriesProperty(): array
    {
        return ServiceCategory::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'icon'])
            ->map(fn (ServiceCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'icon' => $category->icon,
            ])
            ->values()
            ->all();
    }
}
