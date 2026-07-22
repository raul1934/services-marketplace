import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { withFocusRing } from '../lib/a11y';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

/**
 * A field-shaped button: label above, current value (or placeholder) inside, a
 * trailing icon, and a press that opens whatever picks the value.
 *
 * Existed twice with the same measurements and different trailing icons —
 * `PickerField` (used by the single and linked pickers) and an inline copy in
 * `DatePicker`. Both were unlabelled for screen readers, which is the part worth
 * fixing centrally: they look like fields, so they were announced as text.
 */
export function SelectField({
  label,
  value,
  placeholder,
  disabled,
  left,
  icon = 'arrowR',
  onPress,
  accessibilityLabel,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Leading node, e.g. a flag or brand logo in the linked picker. */
  left?: React.ReactNode;
  /** Trailing affordance. The date picker uses a calendar; pickers use a chevron. */
  icon?: IconName;
  onPress?: () => void;
  /** Overrides the default "<label>, <value>" announcement. */
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const isPlaceholder = !value;

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        // Without this the control announces as loose text: the label above and
        // the value inside are separate nodes, and neither says it can be opened.
        accessible
        accessibilityLabel={accessibilityLabel ?? [label, value || placeholder].filter(Boolean).join(', ')}
        accessibilityState={{ disabled: !!disabled }}
        style={withFocusRing(t.colors.accent, {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: t.colors.surface2,
          borderRadius: t.radius.field,
          borderWidth: 1.5,
          borderColor: t.colors.line,
          paddingHorizontal: 14,
          minHeight: 50,
          opacity: disabled ? 0.55 : 1,
        })}
      >
        {left}
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: isPlaceholder ? t.colors.ink3 : t.colors.ink }}>
          {value || placeholder}
        </Text>
        <Icon name={icon} size={18} color={t.colors.ink3} />
      </Pressable>
    </View>
  );
}
