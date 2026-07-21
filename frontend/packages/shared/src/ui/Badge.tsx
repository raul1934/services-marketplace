import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export type BadgeTone = 'open' | 'live' | 'urgent' | 'neutral' | 'ok';

export function Badge({ label, tone = 'neutral', dot }: { label: string; tone?: BadgeTone; dot?: boolean }) {
  const t = useTheme();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    // "live" (accepted / in-progress) must read as ACTIVE, distinct from the
    // green "ok" of a finished job — otherwise every status looks the same green.
    open: { bg: t.colors.accentSoft, fg: t.colors.accent },
    live: { bg: t.colors.accentSoft, fg: t.colors.accent },
    ok: { bg: t.colors.okSoft, fg: t.colors.ok },
    urgent: { bg: t.colors.dangerSoft, fg: t.colors.danger },
    neutral: { bg: t.colors.surface2, fg: t.colors.ink2 },
  };
  const c = map[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: c.bg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: t.radius.btn,
        alignSelf: 'flex-start',
      }}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.fg }} />}
      <Text variant="caption" weight="700" color={c.fg} style={{ fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
