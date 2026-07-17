import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { GeoPoint } from '../api';
import { MapLabel } from './MapLabel';

const MIN = 4;

const toRad = (d: number) => (d * Math.PI) / 180;
const EARTH = 6371000;

/** Length of an edge in metres (equirectangular approx — fine for a building). */
function edgeMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat = toRad((a.latitude + b.latitude) / 2);
  const x = dLng * Math.cos(lat);
  return Math.sqrt(x * x + dLat * dLat) * EARTH;
}

/** Polygon area in m² (shoelace on a local metres projection). */
function polygonArea(pts: GeoPoint[]): number {
  if (pts.length < 3) return 0;
  const mLat = 111320;
  const mLng = 111320 * Math.cos(toRad(pts[0].latitude));
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.longitude * mLng * (b.latitude * mLat) - b.longitude * mLng * (a.latitude * mLat);
  }
  return Math.abs(s) / 2;
}

const mid = (a: GeoPoint, b: GeoPoint): GeoPoint => ({ latitude: (a.latitude + b.latitude) / 2, longitude: (a.longitude + b.longitude) / 2 });
const centroid = (pts: GeoPoint[]): GeoPoint => ({
  latitude: pts.reduce((s, p) => s + p.latitude, 0) / (pts.length || 1),
  longitude: pts.reduce((s, p) => s + p.longitude, 0) / (pts.length || 1),
});
const fmtLen = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`);
const fmtArea = (m2: number) => (m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} ha` : `${Math.round(m2)} m²`);

/** A default square (~30 m per side) centered on the pin, used to seed the editor. */
function defaultSquare(c: GeoPoint): GeoPoint[] {
  const half = 15; // metres from the centre to each edge
  const dLat = half / 111320;
  const dLng = half / (111320 * Math.cos((c.latitude * Math.PI) / 180));
  return [
    { latitude: c.latitude - dLat, longitude: c.longitude - dLng },
    { latitude: c.latitude - dLat, longitude: c.longitude + dLng },
    { latitude: c.latitude + dLat, longitude: c.longitude + dLng },
    { latitude: c.latitude + dLat, longitude: c.longitude - dLng },
  ];
}

/**
 * Full-screen editor for a property's footprint (a closed polygon, min 4 points).
 * Drag each vertex; +/− add/remove points. Works on native and the web stub.
 */
export function GeofenceEditor({
  visible,
  center,
  value,
  onClose,
  onSave,
  inline,
  onChange,
}: {
  visible?: boolean;
  center: GeoPoint;
  value: GeoPoint[] | null;
  onClose?: () => void;
  onSave?: (poly: GeoPoint[]) => void;
  /** Render without the Modal chrome, directly inside the step. */
  inline?: boolean;
  /** Live polygon updates (inline mode); the step owns saving. */
  onChange?: (poly: GeoPoint[]) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [region, setRegion] = useState({ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 });

  /** A region that frames a set of points (used to seed and to re-centre). */
  const frame = (pts: GeoPoint[]) => {
    const lats = pts.map((p) => p.latitude);
    const lngs = pts.map((p) => p.longitude);
    const c = centroid(pts);
    return {
      latitude: c.latitude,
      longitude: c.longitude,
      latitudeDelta: Math.max((Math.max(...lats) - Math.min(...lats)) * 2.4, 0.0012),
      longitudeDelta: Math.max((Math.max(...lngs) - Math.min(...lngs)) * 2.4, 0.0012),
    };
  };
  // Imperative re-frame: works even when the region values repeat (tapping
  // "centre" after the user zoomed/panned away — a plain region prop wouldn't
  // re-sync then).
  const mapRef = useRef<MapView>(null);
  const recenter = () => mapRef.current?.animateToRegion(frame(points), 250);

  // (Re)seed + frame the polygon when the modal opens, or once for inline.
  useEffect(() => {
    if (!inline && !visible) return;
    const init = value && value.length >= MIN ? value : defaultSquare(center);
    setPoints(init);
    setRegion(frame(init));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, inline]);

  // Inline mode reports edits up so the step's detail.geofence stays live — but
  // only once the user actually touches it, so the auto-seeded square doesn't
  // save an area they never intended (the area is optional).
  const edited = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (inline && edited.current && points.length >= MIN) onChangeRef.current?.(points);
  }, [points, inline]);

  const setVertex = (i: number, c: GeoPoint) => {
    edited.current = true;
    setPoints((p) => p.map((pt, idx) => (idx === i ? { latitude: c.latitude, longitude: c.longitude } : pt)));
  };

  const addPoint = () => {
    edited.current = true;
    setPoints((p) => {
      // Insert at the midpoint of the longest edge so the shape stays sensible.
      let best = 0;
      let bestLen = -1;
      for (let i = 0; i < p.length; i++) {
        const a = p[i];
        const b = p[(i + 1) % p.length];
        const len = (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2;
        if (len > bestLen) {
          bestLen = len;
          best = i;
        }
      }
      const a = p[best];
      const b = p[(best + 1) % p.length];
      const mid = { latitude: (a.latitude + b.latitude) / 2, longitude: (a.longitude + b.longitude) / 2 };
      const next = [...p];
      next.splice(best + 1, 0, mid);
      return next;
    });
  };

  const removePoint = () => {
    edited.current = true;
    setPoints((p) => (p.length > MIN ? p.slice(0, -1) : p));
  };

  const mapArea = (
    <View style={{ height: inline ? 320 : undefined, flex: inline ? undefined : 1, borderRadius: inline ? t.radius.card : 0, overflow: 'hidden' }}>
      <MapView ref={mapRef} style={{ flex: 1 }} region={region}>
        <Polygon key="poly" coordinates={points} strokeColor={t.colors.accent} fillColor="rgba(255,255,255,0.5)" strokeWidth={2} />
        {points.map((pt, i) => (
          <Marker
            key={`v${i}`}
            draggable
            coordinate={pt}
            pinColor={t.colors.accent}
            onDrag={(e) => setVertex(i, e.nativeEvent.coordinate)}
            onDragEnd={(e) => setVertex(i, e.nativeEvent.coordinate)}
          />
        ))}
        {points.map((pt, i) => {
          const next = points[(i + 1) % points.length];
          return (
            <Marker key={`el${i}`} coordinate={mid(pt, next)} anchor={{ x: 0.5, y: 0.5 }}>
              <MapLabel text={fmtLen(edgeMeters(pt, next))} tone="edge" />
            </Marker>
          );
        })}
        <Marker key="area" coordinate={centroid(points)} anchor={{ x: 0.5, y: 0.5 }}>
          <MapLabel text={fmtArea(polygonArea(points))} tone="area" />
        </Marker>
      </MapView>
      {/* Re-centre the drawing on screen (after zooming/panning away). */}
      <Pressable
        onPress={recenter}
        accessibilityLabel={tr('assets.geofence.recenter')}
        style={{ position: 'absolute', top: 10, right: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: t.colors.bg, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center', ...t.shadowSm }}
      >
        <Icon name="location" size={20} color={t.colors.accent} />
      </Pressable>
    </View>
  );

  const controls = (
    <>
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Button title={tr('assets.geofence.addPoint')} variant="soft" full onPress={addPoint} left={<Icon name="plus" size={16} color={t.colors.accent} />} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title={tr('assets.geofence.removePoint')} variant="ghost" full onPress={removePoint} disabled={points.length <= MIN} />
        </View>
      </Row>
      <Text variant="caption">{tr('assets.geofence.count', { count: points.length })}</Text>
    </>
  );

  if (inline) {
    return (
      <View style={{ gap: 12 }}>
        <Text variant="caption" color={t.colors.ink3}>{tr('assets.geofence.hint')}</Text>
        {mapArea}
        {controls}
      </View>
    );
  }

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Row style={{ padding: 16, alignItems: 'center', gap: 12 }}>
          <Text weight="800" style={{ fontSize: 18, flex: 1 }}>{tr('assets.geofence.title')}</Text>
          <Button title={tr('common.cancel')} variant="ghost" size="sm" onPress={onClose} />
        </Row>
        <Text variant="caption" style={{ paddingHorizontal: 16, paddingBottom: 8 }}>{tr('assets.geofence.hint')}</Text>
        {mapArea}
        <View style={{ padding: 16, gap: 10 }}>
          {controls}
          <Button title={tr('assets.geofence.save')} variant="grad" full onPress={() => onSave?.(points)} />
        </View>
      </View>
    </Modal>
  );
}
