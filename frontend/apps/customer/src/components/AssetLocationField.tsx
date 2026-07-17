import React, { useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, Text, useTheme } from '@chamafacil/shared';
import { GeoPoint } from '../api';
import { AddressParts, getCurrentCoords } from '../location';
import { GeofenceEditor } from './GeofenceEditor';

/** Patch applied to the asset `detail` (location + structured address parts). */
export interface AssetLocationPatch extends AddressParts {
  latitude?: number;
  longitude?: number;
  address?: string;
  geofence?: GeoPoint[] | null;
}

/**
 * Location editor for a property asset: a draggable pin (also set by map tap or
 * "use my location") + an optional drawn geofence. Feeds the asset's `detail`.
 */
export function AssetLocationField({
  latitude,
  longitude,
  geofence,
  onChange,
  height = 200,
  hideArea,
}: {
  latitude?: number | null;
  longitude?: number | null;
  geofence?: GeoPoint[] | null;
  onChange: (patch: AssetLocationPatch) => void;
  /** Map height; the wizard gives it more room than the edit form. */
  height?: number;
  /** Hide the "draw the area" button — the wizard promotes it to its own step. */
  hideArea?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const hasPin = latitude != null && longitude != null;
  const center = hasPin ? { latitude: latitude as number, longitude: longitude as number } : null;

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { latitude, longitude, ...parts } = await getCurrentCoords();
      onChange({ latitude, longitude, ...parts });
    } catch {
      /* best-effort */
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* No fallback location: with no pin we show a prompt, not a map centered
          on some arbitrary city, so the map only ever shows a real place. */}
      {center ? (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <MapView
            style={{ height }}
            region={{ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            onPress={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
          >
            <Marker
              draggable
              coordinate={{ latitude: center.latitude, longitude: center.longitude }}
              pinColor={t.colors.accent}
              onDragEnd={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
            />
            {geofence && geofence.length >= 2 && (
              <Polygon coordinates={geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
            )}
          </MapView>
        </Card>
      ) : (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="location" size={24} color={t.colors.accent} />
          </View>
          <Text variant="caption" center color={t.colors.ink3}>{tr('assets.locationHint')}</Text>
        </Card>
      )}

      <Button
        title={locating ? tr('assets.locating') : tr('assets.useLocation')}
        variant={hasPin ? 'soft' : undefined}
        full
        onPress={useMyLocation}
        left={<Icon name="location" size={16} color={hasPin ? t.colors.accent : t.colors.accentInk} />}
      />

      {hasPin && !hideArea && (
        <Button
          title={geofence?.length ? tr('assets.editArea', { count: geofence.length }) : tr('assets.addArea')}
          variant="ghost"
          full
          onPress={() => setEditing(true)}
          left={<Icon name="plus" size={16} color={t.colors.accent} />}
        />
      )}

      {center && (
        <GeofenceEditor
          visible={editing}
          center={center}
          value={geofence ?? null}
          onClose={() => setEditing(false)}
          onSave={(poly) => {
            onChange({ geofence: poly });
            setEditing(false);
          }}
        />
      )}
    </View>
  );
}
