import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export interface SegmentItem<T extends string> {
  value: T;
  label: string;
  /** Optional leading icon. Omitted items render label-only, as before. */
  icon?: IconName;
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
              justifyContent: 'center',
              // Icon stacks above the label rather than beside it: side by side,
              // a long label ("Acompanhamento") left the icon fighting it for
              // width and the three tabs came out visibly uneven.
              flexDirection: 'column',
              gap: 3,
              backgroundColor: active ? t.colors.surface : 'transparent',
              ...(active ? t.shadowSm : {}),
            }}
          >
            {it.icon && <Icon name={it.icon} size={15} color={active ? t.colors.accent : t.colors.ink3} />}
            <Text variant="label" color={active ? t.colors.ink : t.colors.ink2}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
