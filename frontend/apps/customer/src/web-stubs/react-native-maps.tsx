/**
 * Web implementation of the react-native-maps API used in the app, backed by
 * Leaflet + OpenStreetMap (no API key). Aliased only for platform 'web' in
 * metro.config.js; native keeps the real react-native-maps.
 *
 * Supports the subset we use: <MapView initialRegion|region onPress> with
 * <Marker coordinate pinColor title description draggable onDrag onDragEnd
 * onPress> and <Polygon coordinates strokeColor fillColor> children. A Marker
 * with a child carrying a `text` prop renders as a text chip (edge/area labels).
 *
 * Children WITHOUT a React `key` are cleared and recreated on every render
 * (the original behavior). KEYED children are reconciled in place — so a marker
 * being dragged isn't destroyed mid-drag, letting the polygon + labels follow
 * the vertex live during the drag.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface MapPress {
  nativeEvent: { coordinate: LatLng };
}

interface MarkerProps {
  coordinate?: LatLng;
  coordinates?: LatLng[];
  pinColor?: string;
  title?: string;
  description?: string;
  draggable?: boolean;
  onDrag?: (e: MapPress) => void;
  onDragEnd?: (e: MapPress) => void;
  onPress?: () => void;
  onCalloutPress?: () => void;
  children?: React.ReactNode;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}

type EntryKind = 'polygon' | 'pin' | 'label' | 'circle';
interface Entry {
  kind: EntryKind;
  layer: L.Layer;
  dragging: boolean;
  onDrag?: (e: MapPress) => void;
  onDragEnd?: (e: MapPress) => void;
}

function zoomFor(delta?: number): number {
  if (!delta || delta <= 0) return 13;
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

/** A colored round pin as a leaflet divIcon, centered exactly on its latlng. */
function pinIcon(color: string, radius = 9): L.DivIcon {
  const d = radius * 2;
  return L.divIcon({
    className: '',
    html: `<div style="box-sizing:border-box;width:${d}px;height:${d}px;border-radius:${radius}px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [d, d],
    iconAnchor: [radius, radius],
  });
}

/** A text chip divIcon (edge length / area), centered on its latlng. */
function labelIcon(text: string, tone?: string): L.DivIcon {
  const isArea = tone === 'area';
  const skin = isArea
    ? 'background:#ff6a3d;color:#fff;'
    : 'background:rgba(255,255,255,0.92);color:#222;border:1px solid rgba(0,0,0,0.08);';
  return L.divIcon({
    className: '',
    html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;${skin}font:700 ${isArea ? 12 : 11}px system-ui,sans-serif;padding:2px 6px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.25);">${text}</div>`,
    iconSize: [0, 0],
  });
}

function polyStyle(p: MarkerProps): L.PolylineOptions {
  return {
    color: p.strokeColor ?? '#ff6a3d',
    weight: p.strokeWidth ?? 2,
    fillColor: p.fillColor ?? p.strokeColor ?? '#ff6a3d',
    fillOpacity: p.fillOpacity ?? 1,
  };
}

const toLatLngs = (cs: LatLng[]) => cs.map((c) => [c.latitude, c.longitude] as [number, number]);
const labelOf = (p: MarkerProps): { text: string; tone?: string } | null => {
  const c = p.children;
  if (!React.isValidElement(c)) return null;
  const lp = c.props as { text?: string; tone?: string };
  return lp.text != null ? { text: lp.text, tone: lp.tone } : null;
};

export default function MapView({
  initialRegion,
  region,
  style,
  children,
  onPress,
}: {
  initialRegion?: Region;
  region?: Region;
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: (e: MapPress) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const unkeyed = useRef<L.LayerGroup | null>(null);
  const keyed = useRef<Map<string, Entry>>(new Map());
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  // init
  useEffect(() => {
    if (!el.current || map.current) return;
    const r = region ?? initialRegion ?? { latitude: -23.56, longitude: -46.64, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const m = L.map(el.current, { attributionControl: false, zoomControl: true }).setView([r.latitude, r.longitude], zoomFor(r.latitudeDelta));
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => {
      onPressRef.current?.({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
    });
    unkeyed.current = L.layerGroup().addTo(m);
    map.current = m;
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
      map.current = null;
      unkeyed.current = null;
      keyed.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep view in sync when a controlled region changes
  useEffect(() => {
    if (map.current && region) map.current.setView([region.latitude, region.longitude], zoomFor(region.latitudeDelta));
  }, [region?.latitude, region?.longitude]);

  // (re)draw children: unkeyed → clear+recreate; keyed → reconcile in place
  useEffect(() => {
    const m = map.current;
    const group = unkeyed.current;
    if (!m || !group) return;
    group.clearLayers();
    const seen = new Set<string>();

    const drawInto = (parent: L.Map | L.LayerGroup, p: MarkerProps): L.Layer | null => {
      if (Array.isArray(p.coordinates)) {
        if (p.coordinates.length < 2) return null;
        return L.polygon(toLatLngs(p.coordinates), polyStyle(p)).addTo(parent);
      }
      if (!p.coordinate) return null;
      const ll: [number, number] = [p.coordinate.latitude, p.coordinate.longitude];
      const lbl = labelOf(p);
      if (lbl) return L.marker(ll, { icon: labelIcon(lbl.text, lbl.tone), interactive: false }).addTo(parent);
      if (p.draggable) {
        const mk = L.marker(ll, { draggable: true, icon: pinIcon(p.pinColor ?? '#ff6a3d') }).addTo(parent);
        if (p.onDrag) mk.on('drag', () => { const x = mk.getLatLng(); p.onDrag!({ nativeEvent: { coordinate: { latitude: x.lat, longitude: x.lng } } }); });
        if (p.onDragEnd) mk.on('dragend', () => { const x = mk.getLatLng(); p.onDragEnd!({ nativeEvent: { coordinate: { latitude: x.lat, longitude: x.lng } } }); });
        if (p.onPress) mk.on('click', () => p.onPress!());
        return mk;
      }
      const cm = L.circleMarker(ll, { color: '#fff', weight: 2, fillColor: p.pinColor ?? '#ff6a3d', fillOpacity: 1, radius: 9 }).addTo(parent);
      if (p.onPress) cm.on('click', p.onPress);
      if (p.title) cm.bindPopup(`<b>${p.title}</b>${p.description ? `<br/>${p.description}` : ''}`);
      if (p.onCalloutPress) cm.on('popupopen', () => {
        const node = cm.getPopup()?.getElement();
        node?.addEventListener('click', () => p.onCalloutPress?.(), { once: true });
      });
      return cm;
    };

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const p = child.props as MarkerProps;
      const key = child.key != null ? String(child.key) : null;

      // Unkeyed: original clear + recreate behavior.
      if (key == null) {
        drawInto(group, p);
        return;
      }
      seen.add(key);

      // Keyed: reconcile in place so a dragged marker survives re-renders.
      const ll: [number, number] | null = p.coordinate ? [p.coordinate.latitude, p.coordinate.longitude] : null;
      const lbl = labelOf(p);
      const kind: EntryKind = Array.isArray(p.coordinates) ? 'polygon' : lbl ? 'label' : p.draggable ? 'pin' : 'circle';
      let entry = keyed.current.get(key);
      if (entry && entry.kind !== kind) {
        m.removeLayer(entry.layer);
        keyed.current.delete(key);
        entry = undefined;
      }

      if (kind === 'polygon') {
        if (!Array.isArray(p.coordinates) || p.coordinates.length < 2) return;
        const pts = toLatLngs(p.coordinates);
        if (!entry) {
          entry = { kind, layer: L.polygon(pts, polyStyle(p)).addTo(m), dragging: false };
          keyed.current.set(key, entry);
        } else {
          (entry.layer as L.Polygon).setLatLngs(pts);
          (entry.layer as L.Polygon).setStyle(polyStyle(p));
        }
        return;
      }
      if (!ll) return;
      if (kind === 'label' && lbl) {
        if (!entry) {
          entry = { kind, layer: L.marker(ll, { icon: labelIcon(lbl.text, lbl.tone), interactive: false }).addTo(m), dragging: false };
          keyed.current.set(key, entry);
        } else {
          (entry.layer as L.Marker).setLatLng(ll);
          (entry.layer as L.Marker).setIcon(labelIcon(lbl.text, lbl.tone));
        }
        return;
      }
      if (kind === 'pin') {
        if (!entry) {
          const mk = L.marker(ll, { draggable: true, icon: pinIcon(p.pinColor ?? '#ff6a3d') }).addTo(m);
          const e: Entry = { kind, layer: mk, dragging: false };
          mk.on('dragstart', () => { e.dragging = true; });
          mk.on('drag', () => { const x = mk.getLatLng(); e.onDrag?.({ nativeEvent: { coordinate: { latitude: x.lat, longitude: x.lng } } }); });
          mk.on('dragend', () => { e.dragging = false; const x = mk.getLatLng(); e.onDragEnd?.({ nativeEvent: { coordinate: { latitude: x.lat, longitude: x.lng } } }); });
          entry = e;
          keyed.current.set(key, entry);
        }
        entry.onDrag = p.onDrag;
        entry.onDragEnd = p.onDragEnd;
        if (!entry.dragging) (entry.layer as L.Marker).setLatLng(ll); // leaflet owns position mid-drag
        return;
      }
      // circle
      if (!entry) {
        entry = { kind, layer: L.circleMarker(ll, { color: '#fff', weight: 2, fillColor: p.pinColor ?? '#ff6a3d', fillOpacity: 1, radius: 9 }).addTo(m), dragging: false };
        if (p.onPress) (entry.layer as L.CircleMarker).on('click', p.onPress);
        keyed.current.set(key, entry);
      } else {
        (entry.layer as L.CircleMarker).setLatLng(ll);
      }
    });

    // Drop keyed layers no longer present.
    for (const [k, entry] of keyed.current) {
      if (!seen.has(k)) {
        m.removeLayer(entry.layer);
        keyed.current.delete(k);
      }
    }
  }, [children]);

  const flat = (StyleSheet.flatten(style) as Record<string, unknown>) ?? {};
  return <div ref={el} style={{ width: '100%', height: '100%', minHeight: 220, ...flat }} />;
}

export function Marker(_props: {
  coordinate: LatLng;
  pinColor?: string;
  title?: string;
  description?: string;
  draggable?: boolean;
  onDrag?: (e: MapPress) => void;
  onDragEnd?: (e: MapPress) => void;
  onPress?: () => void;
  onCalloutPress?: () => void;
  anchor?: { x: number; y: number };
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
