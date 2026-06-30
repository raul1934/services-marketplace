import React from 'react';
import { Text, View } from 'react-native';

/**
 * A small text chip placed on the map (edge length / area). Used as a `<Marker>`
 * child: react-native-maps renders it natively; the web (leaflet) stub reads its
 * `text`/`tone` props and draws an equivalent divIcon.
 */
export function MapLabel({ text, tone = 'edge' }: { text: string; tone?: 'edge' | 'area' }) {
  const area = tone === 'area';
  return (
    <View
      style={{
        backgroundColor: area ? '#ff6a3d' : 'rgba(255,255,255,0.92)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: area ? 0 : 1,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <Text style={{ fontSize: area ? 12 : 11, fontWeight: '700', color: area ? '#fff' : '#222' }}>{text}</Text>
    </View>
  );
}
