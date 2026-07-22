import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useIsOnline } from '../lib/connectivity';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Persistent bar shown while the device has no internet.
 *
 * Deliberately not dismissible, unlike `UpdateBanner`: an update can wait, but
 * "nothing you do right now will reach the server" has to stay on screen for as
 * long as it is true. It disappears by itself the moment the connection is back.
 *
 * Sits under the update banner's zIndex so the two never fight for the same
 * pixels — being offline is the more urgent of the two, so it takes the top.
 */
export function OfflineBanner({ label }: { label: string }) {
  const t = useTheme();
  const online = useIsOnline();

  if (online) return null;

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <View
        // Announced as soon as it appears rather than only when focus reaches
        // it — the whole point is that it interrupts.
        accessibilityLiveRegion="polite"
        accessible
        accessibilityLabel={label}
        style={{
          margin: 10,
          backgroundColor: t.colors.ink,
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Icon name="wifi" size={18} color="#fff" />
        <Text weight="700" color="#fff" style={{ flex: 1, fontSize: 13 }}>
          {label}
        </Text>
      </View>
    </SafeAreaView>
  );
}
