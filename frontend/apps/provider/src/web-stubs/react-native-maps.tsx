/**
 * Web implementation of the react-native-maps API used in the app, backed by
 * Leaflet + OpenStreetMap (no API key). Aliased only for platform 'web' in
 * metro.config.js; native keeps the real react-native-maps.
 */
import React from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// react-dom/server is web-only (this file is the web alias for react-native-maps)
// and may ship without bundled types; require it with an explicit shape.
const { renderToStaticMarkup } = require('react-dom/server') as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapViewHandle {
  animateToRegion: (region: Region, durationMs?: number) => void;
  animateCamera: (camera: { center?: { latitude: number; longitude: number } }, opts?: { duration?: number }) => void;
}

function zoomFor(delta?: number): number {
  if (!delta || delta <= 0) return 13;
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

// Cache the rendered icon SVG by name+color (icons repeat across markers).
const iconSvgCache: Record<string, string> = {};
function iconSvg(name: string, color: string): string {
  const key = `${name}:${color}`;
  if (!iconSvgCache[key]) {
    // Lazy-require shared so this web-only stub (the react-native-maps alias)
    // doesn't pull the whole UI barrel at module-init time.
    const { Icon, ThemeProvider } = require('@walvee/shared') as {
      Icon: React.ComponentType<{ name: string; size?: number; color?: string }>;
      ThemeProvider: React.ComponentType<{ children: React.ReactNode }>;
    };
    iconSvgCache[key] = renderToStaticMarkup(
      <ThemeProvider>
        <Icon name={name} size={17} color={color} />
      </ThemeProvider>,
    );
  }
  return iconSvgCache[key];
}

/** HTML for a request marker: category icon in a white circle, price below. */
function markerHtml(color: string, label: string, iconName: string): string {
  return (
    `<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;white-space:nowrap;">` +
    `<div style="width:32px;height:32px;border-radius:16px;background:#fff;border:2px solid ${color};` +
    `display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${iconSvg(iconName, color)}</div>` +
    (label
      ? `<div style="background:#fff;border:1px solid ${color};border-radius:8px;padding:1px 6px;">` +
        `<span style="color:${color};font-weight:800;font-size:11px;font-family:system-ui,sans-serif;">${label}</span></div>`
      : '') +
    `</div>`
  );
}

function MapViewImpl(
  {
    initialRegion,
    region,
    style,
    children,
    onRegionChangeComplete,
  }: {
    initialRegion?: Region;
    region?: Region;
    style?: ViewStyle;
    children?: React.ReactNode;
    onRegionChangeComplete?: (region: Region) => void;
  },
  ref: React.Ref<MapViewHandle>,
) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  // Keep the latest callback so the once-bound listener always calls the current one.
  const onRegionChange = useRef(onRegionChangeComplete);
  onRegionChange.current = onRegionChangeComplete;

  useImperativeHandle(ref, () => ({
    animateToRegion: (r: Region, durationMs = 300) => {
      map.current?.flyTo([r.latitude, r.longitude], zoomFor(r.latitudeDelta), { duration: durationMs / 1000 });
    },
    animateCamera: (camera, opts) => {
      // Pan only — keeps the current zoom.
      if (camera.center) map.current?.panTo([camera.center.latitude, camera.center.longitude], { animate: true, duration: (opts?.duration ?? 300) / 1000 });
    },
  }), []);

  useEffect(() => {
    if (!el.current || map.current) return;
    const r = region ?? initialRegion ?? { latitude: -23.56, longitude: -46.64, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const m = L.map(el.current, { attributionControl: false, zoomControl: true, maxZoom: 18 }).setView([r.latitude, r.longitude], zoomFor(r.latitudeDelta));
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    // Report the region using a zoom-derived delta (360 / 2^zoom) so it round-trips
    // exactly through zoomFor() — keeps centering/restore at the same zoom level.
    const emitRegion = () => {
      const cb = onRegionChange.current;
      if (!cb) return;
      const c = m.getCenter();
      const d = 360 / Math.pow(2, m.getZoom());
      cb({ latitude: c.lat, longitude: c.lng, latitudeDelta: d, longitudeDelta: d });
    };
    m.on('moveend', emitRegion);
    // Emit the initial region once: Leaflet's init setView fires its moveend before
    // our listener is attached, so callers would otherwise never get it.
    setTimeout(() => {
      m.invalidateSize();
      emitRegion();
    }, 0);
    return () => {
      m.remove();
      map.current = null;
      markers.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (map.current && region) map.current.setView([region.latitude, region.longitude], zoomFor(region.latitudeDelta));
  }, [region?.latitude, region?.longitude]);

  useEffect(() => {
    const layer = markers.current;
    if (!layer) return;
    layer.clearLayers();
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const p = child.props as {
        coordinate?: LatLng; coordinates?: LatLng[]; pinColor?: string; title?: string; description?: string;
        onPress?: () => void; onCalloutPress?: () => void; children?: React.ReactNode;
        strokeColor?: string; fillColor?: string; strokeWidth?: number; fillOpacity?: number;
      };

      // Polygon (read-only geofence / footprint)
      if (Array.isArray(p.coordinates)) {
        if (p.coordinates.length < 2) return;
        const pts = p.coordinates.map((c) => [c.latitude, c.longitude] as [number, number]);
        L.polygon(pts, {
          color: p.strokeColor ?? '#4f46e5',
          weight: p.strokeWidth ?? 2,
          fillColor: p.fillColor ?? p.strokeColor ?? '#4f46e5',
          fillOpacity: p.fillOpacity ?? 1,
        }).addTo(layer);
        return;
      }

      if (!p.coordinate) return;
      const ll: [number, number] = [p.coordinate.latitude, p.coordinate.longitude];

      // Custom marker content (e.g. RequestMarker) carries color/label/iconName.
      const content = React.isValidElement(p.children)
        ? (p.children.props as { color?: string; label?: string; iconName?: string })
        : null;
      if (content?.color && content.iconName) {
        const m = L.marker(ll, { icon: L.divIcon({ html: markerHtml(content.color, content.label ?? '', content.iconName), className: '' }) }).addTo(layer);
        if (p.onPress) m.on('click', p.onPress);
        return;
      }

      const color = p.pinColor ?? '#4f46e5';
      const cm = L.circleMarker(ll, { color: '#fff', weight: 2, fillColor: color, fillOpacity: 1, radius: 9 }).addTo(layer);
      // Tapping the pin fires onPress (selection); a popup/callout fires onCalloutPress.
      if (p.onPress) cm.on('click', p.onPress);
      if (p.title) cm.bindPopup(`<b>${p.title}</b>${p.description ? `<br/>${p.description}` : ''}`);
      if (p.onCalloutPress) cm.on('popupopen', () => {
        const node = cm.getPopup()?.getElement();
        node?.addEventListener('click', () => p.onCalloutPress?.(), { once: true });
      });
    });
  }, [children]);

  const flat = (StyleSheet.flatten(style) as Record<string, unknown>) ?? {};
  return <div ref={el} style={{ width: '100%', height: '100%', minHeight: 220, ...flat }} />;
}

const MapView = React.forwardRef(MapViewImpl);
export default MapView;

export function Marker(_props: {
  coordinate: LatLng;
  pinColor?: string;
  title?: string;
  description?: string;
  onPress?: () => void;
  onCalloutPress?: () => void;
  children?: React.ReactNode;
}) {
  return null;
}

export function Polygon(_props: {
  coordinates: LatLng[];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}) {
  return null;
}
