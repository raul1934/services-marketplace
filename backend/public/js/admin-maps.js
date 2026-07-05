// Shared Alpine components for the admin Leaflet map views (LiveMap page and
// the per-request map modal on ServiceRequestResource). Loaded once via
// AdminPanelProvider's HEAD_END render hook — NOT as an inline <script> on
// the individual Blade views. A modal's content is injected via a Livewire
// AJAX swap, and Alpine scans/evaluates its `x-data` attribute as soon as
// the markup lands in the DOM, which can happen before a sibling inline
// <script> tag in that same injected fragment has actually executed. Loading
// these functions up front in <head> (parsed before any page/modal content
// exists) sidesteps that race entirely.

function liveMap(markets, icons, categories) {
    return {
        map: null,
        markers: new Map(),
        lines: new Map(),
        statusColors: { open: '#1772d2', accepted: '#f59e0b', in_progress: '#12a37a' },
        // Exposed as data (not just a closure variable) — templates like the
        // category filter checklist read `icons` via x-html, and Alpine only
        // resolves bare identifiers against properties of this returned
        // object, not the surrounding factory function's closure scope.
        icons: icons ?? {},
        categories: categories ?? [],
        filtersOpen: false,
        statusFilter: { open: true, accepted: true, in_progress: true },
        categoryFilter: Object.fromEntries((categories ?? []).map((c) => [c.id, true])),
        toggleAllCategories(checked) {
            this.categories.forEach((c) => { this.categoryFilter[c.id] = checked; });
            this.refresh();
        },
        init(el) {
            // The map target is $refs.mapEl (a nested child), not `el` itself —
            // `el` is the outer wrapper that also holds the filter UI, kept in
            // the same Alpine scope so the filter checkboxes can reactively
            // read/write statusFilter/categoryFilter alongside the map.
            const mapEl = this.$refs.mapEl;
            if (this.map || mapEl._leaflet_id) {
                return;
            }
            const firstCentroid = markets.length ? markets[0].centroid : null;
            this.map = L.map(mapEl).setView(
                firstCentroid ? [firstCentroid.latitude, firstCentroid.longitude] : [-20.8197, -49.3794],
                markets.length ? 10 : 5,
            );
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 18,
            }).addTo(this.map);

            markets.forEach((market) => {
                L.polygon(market.points, {
                    color: '#4ccd9b',
                    weight: 1.5,
                    fillOpacity: 0.08,
                }).addTo(this.map).bindTooltip(market.name);
            });

            new ResizeObserver(() => this.map.invalidateSize()).observe(mapEl);

            this.refresh();
            setInterval(() => this.refresh(), 5000);
        },
        // Icon SVGs are pre-fetched server-side (see LiveMap::getIconsProperty)
        // and handed in as `icons`, so building a pin never hits the network.
        pinIcon(iconKey, color) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5);`;
            wrapper.innerHTML = icons[iconKey] ?? icons.user ?? '';
            const svg = wrapper.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '16');
                svg.setAttribute('height', '16');
            }

            return L.divIcon({
                className: '',
                html: wrapper.outerHTML,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
        },
        // Updates existing markers/lines in place (setLatLng) instead of
        // destroying and rebuilding every layer each tick — a full
        // teardown+recreate on every 5s refresh is what made an in-progress
        // zoom/pan gesture feel like it stalled.
        refresh() {
            fetch('/admin/map-markers', { headers: { Accept: 'application/json' } })
                .then((res) => res.json())
                .then(({ customers, providers }) => {
                    // Filtered-out requests simply never enter `seen` below, so
                    // the existing diff/cleanup pass removes their markers/lines
                    // the same way it already removes ones that left the
                    // active-in-market scope server-side.
                    customers = customers.filter((c) => (
                        this.statusFilter[c.status] !== false
                        && this.categoryFilter[c.categoryId] !== false
                    ));

                    const providerById = Object.fromEntries(providers.map((p) => [p.id, p]));
                    const seen = new Set();

                    customers.forEach((c) => {
                        const color = this.statusColors[c.status] ?? '#93a0b5';
                        const key = `customer-${c.id}`;
                        seen.add(key);
                        let marker = this.markers.get(key);
                        if (marker) {
                            marker.setLatLng([c.lat, c.lng]);
                        } else {
                            marker = L.marker([c.lat, c.lng], { icon: this.pinIcon(c.icon, color) }).addTo(this.map);
                            this.markers.set(key, marker);
                        }
                        marker.getTooltip()
                            ? marker.setTooltipContent(`#${c.id} · ${c.label ?? '—'} · ${c.status}`)
                            : marker.bindTooltip(`#${c.id} · ${c.label ?? '—'} · ${c.status}`);

                        const provider = providerById[c.id];
                        const pKey = `provider-${c.id}`;
                        if (provider) {
                            seen.add(pKey);
                            let pMarker = this.markers.get(pKey);
                            if (pMarker) {
                                pMarker.setLatLng([provider.lat, provider.lng]);
                            } else {
                                pMarker = L.marker([provider.lat, provider.lng], { icon: this.pinIcon('truck', color) }).addTo(this.map);
                                this.markers.set(pKey, pMarker);
                            }
                            pMarker.getTooltip()
                                ? pMarker.setTooltipContent(`#${provider.id} · ${provider.label ?? '—'} · ${provider.status}`)
                                : pMarker.bindTooltip(`#${provider.id} · ${provider.label ?? '—'} · ${provider.status}`);

                            let line = this.lines.get(pKey);
                            const latlngs = [[c.lat, c.lng], [provider.lat, provider.lng]];
                            if (line) {
                                line.setLatLngs(latlngs);
                                line.setStyle({ color });
                            } else {
                                line = L.polyline(latlngs, { color, weight: 2, dashArray: '4 6', opacity: 0.7 }).addTo(this.map);
                                this.lines.set(pKey, line);
                            }
                        }
                    });

                    [...this.markers.keys()].filter((key) => !seen.has(key)).forEach((key) => {
                        this.map.removeLayer(this.markers.get(key));
                        this.markers.delete(key);
                    });
                    [...this.lines.keys()].filter((key) => !seen.has(key)).forEach((key) => {
                        this.map.removeLayer(this.lines.get(key));
                        this.lines.delete(key);
                    });
                });
        },
    };
}

// Plain DOM + MutationObserver, deliberately NOT an Alpine x-data component:
// this container is injected via a Filament modal's Livewire AJAX swap, and
// Alpine's $el/$refs magics were observed to resolve to `undefined` in that
// injection path (confirmed: "Map container not found" / "Cannot read
// properties of undefined") even though the identical x-data+x-init+$el
// pattern works fine for LiveMap's full-page render. Watching for the
// container to land in the DOM sidesteps that Alpine-in-a-modal timing issue
// entirely — this only depends on the element existing, not on directive
// evaluation order.
(function () {
    const liveStatuses = ['open', 'accepted', 'in_progress'];
    const statusColors = { open: '#1772d2', accepted: '#f59e0b', in_progress: '#12a37a' };

    function pinIcon(icons, iconKey, color) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5);`;
        wrapper.innerHTML = icons[iconKey] ?? icons.user ?? '';
        const svg = wrapper.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', '16');
            svg.setAttribute('height', '16');
        }

        return L.divIcon({
            className: '',
            html: wrapper.outerHTML,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
    }

    function initRequestMap(el) {
        const record = JSON.parse(el.dataset.record);
        const icons = JSON.parse(el.dataset.icons);
        const header = el.previousElementSibling;
        const state = { color: statusColors[record.status] ?? '#93a0b5', marker: null, providerMarker: null, line: null };

        const map = L.map(el).setView([record.lat, record.lng], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 18,
        }).addTo(map);
        state.marker = L.marker([record.lat, record.lng], { icon: pinIcon(icons, record.icon, state.color) }).addTo(map);

        new ResizeObserver(() => map.invalidateSize()).observe(el);

        // Only requests still in flight have anything to poll for — a
        // completed/cancelled request's position never changes again.
        if (!liveStatuses.includes(record.status)) {
            return;
        }

        const refresh = () => {
            fetch('/admin/map-markers', { headers: { Accept: 'application/json' } })
                .then((res) => res.json())
                .then(({ customers, providers }) => {
                    const customer = customers.find((c) => c.id === record.id);
                    if (!customer) {
                        return;
                    }

                    state.color = statusColors[customer.status] ?? '#93a0b5';
                    state.marker.setLatLng([customer.lat, customer.lng]);
                    state.marker.setIcon(pinIcon(icons, record.icon, state.color));

                    if (header) {
                        const dot = header.querySelector('[data-role="status-dot"]');
                        const label = header.querySelector('[data-role="status-label"]');
                        if (dot) dot.style.background = state.color;
                        if (label) label.textContent = `#${record.id} · ${record.label ?? '—'} · ${customer.status}`;
                    }

                    const provider = providers.find((p) => p.id === record.id);
                    if (provider) {
                        const latlngs = [[customer.lat, customer.lng], [provider.lat, provider.lng]];
                        const isNewProvider = !state.providerMarker;

                        if (state.providerMarker) {
                            state.providerMarker.setLatLng([provider.lat, provider.lng]);
                            state.providerMarker.setIcon(pinIcon(icons, 'truck', state.color));
                        } else {
                            state.providerMarker = L.marker([provider.lat, provider.lng], { icon: pinIcon(icons, 'truck', state.color) }).addTo(map);
                        }

                        if (state.line) {
                            state.line.setLatLngs(latlngs);
                            state.line.setStyle({ color: state.color });
                        } else {
                            state.line = L.polyline(latlngs, { color: state.color, weight: 2, dashArray: '4 6', opacity: 0.7 }).addTo(map);
                        }

                        // Fit the view once, the moment a provider first shows up —
                        // not on every refresh, or the map would yank back and undo
                        // any manual zoom/pan the admin just did.
                        if (isNewProvider) {
                            map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
                        }
                    } else if (state.providerMarker) {
                        map.removeLayer(state.providerMarker);
                        state.providerMarker = null;
                        if (state.line) {
                            map.removeLayer(state.line);
                            state.line = null;
                        }
                    }
                });
        };

        refresh();
        const intervalId = setInterval(() => {
            if (!document.body.contains(el)) {
                clearInterval(intervalId);
                return;
            }
            refresh();
        }, 5000);
    }

    function scan() {
        document.querySelectorAll('.js-request-map:not([data-initialized])').forEach((el) => {
            el.setAttribute('data-initialized', '1');
            initRequestMap(el);
        });
    }

    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
    if (document.readyState !== 'loading') {
        scan();
    } else {
        document.addEventListener('DOMContentLoaded', scan);
    }
})();
