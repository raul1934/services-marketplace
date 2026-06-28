import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentItem<T extends string> {
  value: T;
  label: string;
}

export function Segment<T extends string>({
  items,
  value,
  onChange,
}: {
  items: SegmentItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.surface2,
        borderRadius: t.radius.field,
        borderWidth: 1,
        borderColor: t.colors.line,
        padding: 4,
        gap: 4,
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <Pressable
            key={it.value}
            onPress={() => onChange(it.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: active ? t.colors.surface : 'transparent',
              ...(active ? t.shadowSm : {}),
            }}
          >
            <Text variant="label" color={active ? t.colors.ink : t.colors.ink2}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
