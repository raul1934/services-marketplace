/**
 * Web implementation of the react-native-maps API used in the app, backed by
 * Leaflet + OpenStreetMap (no API key). Aliased only for platform 'web' in
 * metro.config.js; native keeps the real react-native-maps.
 *
 * Supports the subset we use: <MapView initialRegion|region> with <Marker
 * coordinate pinColor title description onCalloutPress> children.
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

function zoomFor(delta?: number): number {
  if (!delta || delta <= 0) return 13;
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

export default function MapView({
  initialRegion,
  region,
  style,
  children,
}: {
  initialRegion?: Region;
  region?: Region;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);

  // init
  useEffect(() => {
    if (!el.current || map.current) return;
    const r = region ?? initialRegion ?? { latitude: -23.56, longitude: -46.64, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const m = L.map(el.current, { attributionControl: false, zoomControl: true }).setView([r.latitude, r.longitude], zoomFor(r.latitudeDelta));
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    markers.current = L.layerGroup().addTo(m);
    map.current = m;
    setTimeout(() => m.invalidateSize(), 0);
    return () => {
      m.remove();
      map.current = null;
      markers.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep view in sync when a controlled region changes
  useEffect(() => {
    if (map.current && region) map.current.setView([region.latitude, region.longitude], zoomFor(region.latitudeDelta));
  }, [region?.latitude, region?.longitude]);

  // (re)draw markers from children
  useEffect(() => {
    const layer = markers.current;
    if (!layer) return;
    layer.clearLayers();
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const p = child.props as { coordinate?: LatLng; pinColor?: string; title?: string; description?: string; onPress?: () => void; onCalloutPress?: () => void };
      if (!p.coordinate) return;
      const color = p.pinColor ?? '#ff6a3d';
      const cm = L.circleMarker([p.coordinate.latitude, p.coordinate.longitude], {
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
        radius: 9,
      }).addTo(layer);
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

export function Marker(_props: {
  coordinate: LatLng;
  pinColor?: string;
  title?: string;
  description?: string;
  onPress?: () => void;
  onCalloutPress?: () => void;
}) {
  return null;
}
