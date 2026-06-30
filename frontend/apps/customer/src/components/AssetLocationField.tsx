import React, { useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, Row, Text, useTheme } from '@walvee/shared';
import { GeoPoint } from '../api';
import { getCurrentCoords } from '../location';
import { GeofenceEditor } from './GeofenceEditor';

const FALLBACK = { latitude: -23.56, longitude: -46.64 };

/** Patch applied to the asset `detail` (latitude/longitude/address/geofence). */
export interface AssetLocationPatch {
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
}: {
  latitude?: number | null;
  longitude?: number | null;
  geofence?: GeoPoint[] | null;
  onChange: (patch: AssetLocationPatch) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const hasPin = latitude != null && longitude != null;
  const center = hasPin ? { latitude: latitude as number, longitude: longitude as number } : FALLBACK;

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      onChange({ latitude: c.latitude, longitude: c.longitude, ...(c.address ? { address: c.address } : {}) });
    } catch {
      /* best-effort */
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <MapView
          style={{ height: 200 }}
          region={{ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          onPress={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
        >
          {hasPin && (
            <Marker
              draggable
              coordinate={{ latitude: center.latitude, longitude: center.longitude }}
              pinColor={t.colors.accent}
              onDragEnd={(e) => onChange({ latitude: e.nativeEvent.coordinate.latitude, longitude: e.nativeEvent.coordinate.longitude })}
            />
          )}
          {geofence && geofence.length >= 2 && (
            <Polygon coordinates={geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
          )}
        </MapView>
      </Card>

      <Button
        title={locating ? tr('assets.locating') : tr('assets.useLocation')}
        variant="soft"
        full
        onPress={useMyLocation}
        left={<Icon name="location" size={16} color={t.colors.accent} />}
      />
      {!hasPin && <Text variant="caption">{tr('assets.locationHint')}</Text>}

      {hasPin && (
        <Button
          title={geofence?.length ? tr('assets.editArea', { count: geofence.length }) : tr('assets.addArea')}
          variant="ghost"
          full
          onPress={() => setEditing(true)}
          left={<Icon name="plus" size={16} color={t.colors.accent} />}
        />
      )}

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
    </View>
  );
}
