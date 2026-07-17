import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

/**
 * Friendly empty/placeholder state with a designed icon badge (gradient on a
 * soft halo) instead of a bare emoji. `tone="muted"` for non-actionable states
 * (e.g. offline). Optional CTA.
 */
export function EmptyState({
  icon = 'search',
  title,
  body,
  action,
  tone = 'brand',
  fill = false,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; variant?: 'grad' | 'soft' | 'ghost' };
  tone?: 'brand' | 'muted';
  /** Expand to fill available height and center vertically (use when it's the whole screen's content). */
  fill?: boolean;
}) {
  const t = useTheme();
  const brand = tone === 'brand';
  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
        fill ? { flex: 1 } : { paddingVertical: 44 },
      ]}
    >
      <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: brand ? t.colors.accentSoft : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        {/* faint concentric ring for depth */}
        <View style={{ position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: brand ? t.colors.accent : t.colors.line, opacity: brand ? 0.16 : 0.5 }} />
        {brand ? (
          <LinearGradient
            colors={t.grad as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' }, t.shadowSm]}
          >
            <Icon name={icon} size={32} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={30} color={t.colors.ink3} />
          </View>
        )}
      </View>

      <View style={{ alignItems: 'center', gap: 5 }}>
        <Text variant="h3" center>{title}</Text>
        {body ? <Text variant="caption" center style={{ maxWidth: 300, lineHeight: 18 }}>{body}</Text> : null}
      </View>

      {action ? (
        <Button title={action.label} variant={action.variant ?? 'soft'} onPress={action.onPress} style={{ marginTop: 2 }} />
      ) : null}
    </View>
  );
}
