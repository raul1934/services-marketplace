import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { AppKey, useAppUpdate } from '../lib/appUpdate';
import { Icon } from './Icon';
import { Text } from './Text';

interface Props {
  /** Which app is checking — picks its entry in version.json. */
  app: AppKey;
  title?: string;
  cta?: string;
}

/**
 * Floating "update available" banner. Polls `version.json` on launch (see
 * useAppUpdate); when a newer APK is published it shows a bar with an "Atualizar"
 * button that opens the APK download in the browser. Dismissible per session.
 * Renders nothing until (and unless) an update is available.
 */
export function UpdateBanner({ app, title = 'Atualização disponível', cta = 'Atualizar' }: Props) {
  const t = useTheme();
  const { available, version, url, notes } = useAppUpdate(app);
  const [dismissed, setDismissed] = useState(false);

  if (!available || dismissed || !url) return null;

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
      <View
        style={{
          margin: 10,
          backgroundColor: t.colors.accent,
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
        <Icon name="sparkles" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ color: '#fff', fontSize: 14 }}>
            {title}
            {version ? ` (v${version})` : ''}
          </Text>
          {notes ? (
            <Text style={{ color: '#fff', opacity: 0.9, fontSize: 12 }} numberOfLines={2}>
              {notes}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => Linking.openURL(url)} style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }} accessibilityRole="button">
          <Text weight="800" style={{ color: t.colors.accent, fontSize: 13 }}>{cta}</Text>
        </Pressable>
        <Pressable onPress={() => setDismissed(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar">
          <Icon name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
