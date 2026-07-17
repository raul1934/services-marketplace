import React from 'react';
import { View } from 'react-native';
import { Icon, IconName, Text } from '@chamafacil/shared';

/**
 * Map marker content for a nearby request: the category icon (in a white circle)
 * with the average price below it. Both the icon and the price take the urgency
 * color (red when urgent, accent otherwise). Used as the child of a <Marker>
 * (native renders it; the web Leaflet stub reads these props to build an HTML
 * marker). The props are precomputed by the caller so both platforms match.
 */
export function RequestMarker({ color, label, iconName }: { color: string; label: string; iconName: IconName }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={iconName} size={17} color={color} />
      </View>
      {label ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: color, paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text weight="800" style={{ fontSize: 11, color }}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}
