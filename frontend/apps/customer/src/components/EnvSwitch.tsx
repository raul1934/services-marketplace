import React, { useState } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { Text, useTheme } from '@chamafacil/shared';
import { EnvName, ENVS, getEnv, setEnv } from '../env';

/**
 * Dev ↔ Prod environment toggle for the pre-login screens. Switching re-points the
 * API client immediately (and persists the choice), so the next login hits the
 * chosen backend without a rebuild. Pass `onAccent` when placed on a gradient.
 */
export function EnvSwitch({ onAccent, style }: { onAccent?: boolean; style?: ViewStyle }) {
  const t = useTheme();
  const [env, setE] = useState<EnvName>(getEnv());
  const idleFg = onAccent ? 'rgba(255,255,255,0.85)' : t.colors.ink3;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: onAccent ? 'rgba(255,255,255,0.16)' : t.colors.surface2,
          borderRadius: 999,
          padding: 3,
          borderWidth: 1,
          borderColor: onAccent ? 'rgba(255,255,255,0.35)' : t.colors.line,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {(['dev', 'prod'] as EnvName[]).map((k) => {
        const active = env === k;
        const activeBg = onAccent ? '#ffffff' : t.colors.accent;
        const activeFg = onAccent ? t.colors.accent : t.colors.accentInk;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={`Ambiente ${ENVS[k].label}`}
            onPress={() => {
              setE(k);
              void setEnv(k);
            }}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: active ? activeBg : 'transparent',
            }}
          >
            <Text weight="800" style={{ fontSize: 11, letterSpacing: 0.5, color: active ? activeFg : idleFg }}>
              {k === 'dev' ? 'DEV' : 'PROD'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
