import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { PaymentMethod } from '../types';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

export interface PaymentOption {
  value: PaymentMethod;
  label: string;
  detail: string;
  icon: IconName;
}

/**
 * Pix / Card / Cash selector (chamafacil .segment + detail). A segmented row of
 * three options with a detail line describing the selected one.
 */
export function PaymentSelector({
  value,
  onChange,
  options,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  options: PaymentOption[];
}) {
  const t = useTheme();
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', backgroundColor: t.colors.surface2, borderRadius: t.radius.field, borderWidth: 1, borderColor: t.colors.line, padding: 4, gap: 4 }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 7,
                backgroundColor: active ? t.colors.surface : 'transparent',
                ...(active ? t.shadowSm : {}),
              }}
            >
              <Icon name={o.icon} size={16} color={active ? t.colors.accent : t.colors.ink2} />
              <Text variant="label" color={active ? t.colors.ink : t.colors.ink2}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: 14, padding: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={selected.icon} size={20} color={t.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 14.5 }}>{selected.label}</Text>
            <Text variant="caption" style={{ marginTop: 1 }}>{selected.detail}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
