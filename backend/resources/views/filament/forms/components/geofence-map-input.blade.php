@php
    use App\Models\Market;

    $statePath = $getStatePath();
    $currentId = $getRecord()?->id;

    // Shown for reference (and as snap targets) while drawing this market's
    // boundary — read-only: rendered non-interactive so clicks pass through
    // to the map underneath instead of letting this field edit them.
    $otherMarkets = Market::query()
        ->when($currentId, fn ($query) => $query->where('id', '!=', $currentId))
        ->get(['id', 'name', 'geofence'])
        ->filter(fn (Market $market) => count($market->geofence ?? []) >= 3)
        ->map(fn (Market $market) => [
            'id' => $market->id,
            'name' => $market->name,
            'points' => collect($market->geofence)->map(fn ($p) => [$p['latitude'], $p['longitude']])->all(),
        ])
        ->values()
        ->all();
@endphp

<x-dynamic-component :component="$getFieldWrapperView()" :field="$field">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <div
        wire:ignore
        x-data="geofenceMapInput({ state: $wire.{{ $applyStateBindingModifiers("\$entangle('{$statePath}')") }}, otherMarkets: @js($otherMarkets) })"
        x-init="init($el)"
    >
        <div x-ref="map" style="height: 360px; border-radius: 0.5rem; overflow: hidden;"></div>

        <div class="fi-fo-field-wrp-helper-text mt-2 flex items-center justify-between text-sm">
            <span x-text="state.length + ' point(s) — ' + (state.length >= 3 ? 'boundary set' : 'click the map to add at least 3 points')"></span>
            <div class="flex items-center gap-4">
                <label class="flex items-center gap-2">
                    <input type="checkbox" x-model="snapEnabled" class="fi-checkbox-input rounded" />
                    <span>Snap to other cities' points</span>
                </label>
                <button type="button" x-on:click="undo()" class="fi-link text-sm font-medium text-primary-600 dark:text-primary-400">Undo last point</button>
                <button type="button" x-on:click="clear()" class="fi-link text-sm font-medium text-danger-600 dark:text-danger-400">Clear</button>
            </div>
        </div>
    </div>

    <script>
        function geofenceMapInput({ state, otherMarkets }) {
            return {
                state,
                otherMarkets: otherMarkets ?? [],
                snapEnabled: false,
                snapPoints: [],
                map: null,
                markers: [],
                polygon: null,
                init(el) {
                    if (this.map || el?._leaflet_id) {
                        return;
                    }
                    if (!Array.isArray(this.state)) {
                        this.state = [];
                    }

                    const start = this.state.length
                        ? [this.state[0].latitude, this.state[0].longitude]
                        : (this.otherMarkets[0]?.points[0] ?? [-20.8197, -49.3794]);
                    this.map = L.map(this.$refs.map).setView(start, 11);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 18,
                    }).addTo(this.map);

                    this.drawOtherMarkets();
                    this.state.forEach((p) => this.addMarker(p.latitude, p.longitude));
                    this.redrawPolygon();

                    this.map.on('click', (e) => {
                        const { lat, lng } = this.trySnap(e.latlng);
                        this.state.push({ latitude: lat, longitude: lng });
                        this.addMarker(lat, lng);
                        this.redrawPolygon();
                    });

                    // If this field lives inside a Filament Tab that isn't the
                    // active one on load, Filament clips it to height:0 rather
                    // than display:none — Leaflet measures that as its size and
                    // renders broken/blank until told to re-measure. Watch for
                    // the container's real size showing up (i.e. its tab
                    // becoming active) and re-check every time.
                    new ResizeObserver(() => this.map.invalidateSize()).observe(el ?? this.$refs.map);
                },
                // Other markets' boundaries, drawn once for reference/snapping.
                // `interactive: false` keeps them purely visual — clicks land on
                // the map underneath instead of on these shapes, so there's no
                // way to select/drag/edit another city's points from here.
                drawOtherMarkets() {
                    this.otherMarkets.forEach((market) => {
                        L.polygon(market.points, {
                            color: '#93a0b5',
                            weight: 1.5,
                            dashArray: '4 6',
                            fillOpacity: 0.05,
                            interactive: false,
                        }).addTo(this.map).bindTooltip(market.name);

                        market.points.forEach(([lat, lng]) => this.snapPoints.push({ lat, lng }));
                    });
                },
                // Within ~12px on screen of another city's vertex, snap to its
                // exact coordinates — makes it easy to line two markets' borders
                // up exactly instead of eyeballing it. Threshold is in screen
                // pixels (not degrees) so it feels the same at any zoom level.
                trySnap(latlng) {
                    if (!this.snapEnabled || !this.snapPoints.length) {
                        return { lat: latlng.lat, lng: latlng.lng };
                    }
                    const point = this.map.latLngToContainerPoint(latlng);
                    let nearest = null;
                    let nearestDist = 12;
                    this.snapPoints.forEach((p) => {
                        const dist = point.distanceTo(this.map.latLngToContainerPoint([p.lat, p.lng]));
                        if (dist < nearestDist) {
                            nearest = p;
                            nearestDist = dist;
                        }
                    });
                    return nearest ? { lat: nearest.lat, lng: nearest.lng } : { lat: latlng.lat, lng: latlng.lng };
                },
                addMarker(lat, lng) {
                    const index = this.markers.length;
                    const marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
                    // Indices stay stable for existing points: undo()/clear() only
                    // ever remove from the end, never the middle, so it's safe to
                    // close over `index` here rather than re-resolving it via
                    // this.markers.indexOf(marker) on every drag.
                    marker.on('drag', (e) => {
                        const { lat, lng } = this.trySnap(e.target.getLatLng());
                        marker.setLatLng([lat, lng]);
                        this.state[index] = { latitude: lat, longitude: lng };
                        this.redrawPolygon();
                    });
                    this.markers.push(marker);
                },
                redrawPolygon() {
                    if (this.polygon) {
                        this.map.removeLayer(this.polygon);
                        this.polygon = null;
                    }
                    if (this.state.length >= 3) {
                        this.polygon = L.polygon(this.state.map((p) => [p.latitude, p.longitude]), {
                            color: '#1772d2',
                            fillOpacity: 0.15,
                        }).addTo(this.map);
                    }
                },
                undo() {
                    this.state.pop();
                    const marker = this.markers.pop();
                    if (marker) {
                        this.map.removeLayer(marker);
                    }
                    this.redrawPolygon();
                },
                clear() {
                    this.state.splice(0, this.state.length);
                    this.markers.forEach((m) => this.map.removeLayer(m));
                    this.markers = [];
                    this.redrawPolygon();
                },
            };
        }
    </script>
</x-dynamic-component>
