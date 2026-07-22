import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

/**
 * Full-width gradient call-to-action: title, supporting line, and a rounded
 * badge holding an icon.
 *
 * The home had two of these — "precisa de ajuda agora?" and "cadastre seu
 * primeiro ativo" — identical down to the 46px badge and the 0.2 white overlay
 * behind its icon. Both reached the accessibility tree as bare ViewGroups, so a
 * screen reader read the pitch without saying it could be acted on; the fix had
 * to be written twice, which is the argument for this component existing.
 */
export function GradientCTACard({
  title,
  body,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  icon: IconName;
  onPress: () => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      // The whole card is one control, so it is announced as one sentence rather
      // than a heading followed by loose prose.
      accessibilityLabel={`${title}. ${body}`}
      style={({ focused }: any) => focusRing(t.colors.accent, focused)}
    >
      <LinearGradient
        colors={t.grad as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: t.radius.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View style={{ flex: 1 }}>
          <Text weight="800" color="#fff" style={{ fontSize: 17 }}>
            {title}
          </Text>
          <Text color="rgba(255,255,255,0.9)" style={{ fontSize: 13, marginTop: 2 }}>
            {body}
          </Text>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={icon} size={icon === 'plus' ? 26 : 24} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
