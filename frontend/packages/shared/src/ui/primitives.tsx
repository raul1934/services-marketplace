import React from 'react';
import { Animated, Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Text } from './Text';
import { Icon, IconName } from './Icon';

/** Round 40px icon button (chamafacil .iconbtn). */
export function IconButton({
  name,
  onPress,
  size = 20,
  accessibilityLabel,
  badge,
}: {
  name: IconName;
  onPress?: () => void;
  size?: number;
  accessibilityLabel?: string;
  /** Unread count. Zero and undefined both render nothing. */
  badge?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      style={({ hovered, focused }: any) => [
        { width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' },
        t.dark ? null : t.shadowSm,
        hovered ? { backgroundColor: t.colors.surface2 } : null,
        focusRing(t.colors.accent, focused),
      ]}
    >
      <Icon name={name} size={size} color={t.colors.ink} />
      {badge ? <Badge count={badge} /> : null}
    </Pressable>
  );
}

/** Unread-count dot for IconButton: a pulsing ring plus the number. */
function Badge({ count }: { count: number }) {
  const t = useTheme();
  const pulse = React.useRef(new Animated.Value(0)).current;

  const previous = React.useRef(count);

  React.useEffect(() => {
    // Ring once when something *arrives*, then rest. It used to loop forever for
    // as long as anything was unread, which is not information — after the first
    // second it is decoration that costs battery, and it never stops asking for
    // attention it has already got. It also kept the app permanently non-idle,
    // which silently breaks anything that waits for idle (uiautomator, Espresso).
    const arrived = count > previous.current;
    previous.current = count;
    if (!arrived) return;

    pulse.setValue(0);
    // Reanimated isn't a peer dep of this package, and RN's Animated is enough
    // for one ring. `useNativeDriver` keeps it off the JS thread, so it plays
    // even while the app is busy handling whatever just arrived.
    const anim = Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [count, pulse]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -3, right: -3, alignItems: 'center', justifyContent: 'center' }}>
      {/* The ring expands out of the badge and fades — drawn behind it, and
          sized to the badge so it reads as one object breathing. */}
      <Animated.View
        style={{
          position: 'absolute',
          width: BADGE_H,
          height: BADGE_H,
          borderRadius: BADGE_H / 2,
          backgroundColor: t.colors.danger,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
        }}
      />
      <View
        style={{
          minWidth: BADGE_H,
          height: BADGE_H,
          borderRadius: BADGE_H / 2,
          paddingHorizontal: 4,
          backgroundColor: t.colors.danger,
          borderWidth: 2,
          borderColor: t.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* includeFontPadding is Android's default and adds invisible padding
            above/below the glyph, which shoves the number off-centre in a box
            this small. lineHeight pins it to the box. Past 99 the exact number
            stops mattering and stops fitting. */}
        <Text
          weight="800"
          color="#fff"
          style={{ fontSize: 10, lineHeight: 10, includeFontPadding: false, textAlign: 'center' }}
        >
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    </View>
  );
}

/** Badge diameter — the ring and the number share it. */
const BADGE_H = 18;

/** Gradient initials avatar (chamafacil .avatar) — uses a flat accent fill. */
export function AvatarGrad({ initials, size = 42 }: { initials: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text weight="800" color="#fff" style={{ fontSize: size * 0.38 }}>
        {initials}
      </Text>
    </View>
  );
}

/** App bar with optional leading action, small subtitle + big title, and
 *  trailing actions (chamafacil .appbar). */
export function AppBar({ sub, title, left, right }: { sub?: string; title: string; left?: React.ReactNode; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 }}>
      {left}
      <View style={{ flex: 1 }}>
        {sub ? (
          <Text style={{ color: t.colors.ink2, fontSize: 13, fontWeight: '600', marginBottom: 1 }}>{sub}</Text>
        ) : null}
        <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.5 }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

/** Back bar: round back button + inline title + optional trailing (chamafacil .backbar). */
export function BackBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
      <Pressable
        onPress={onBack}
        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="back" size={20} color={t.colors.ink} />
      </Pressable>
      <Text style={{ fontSize: 19, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.2 }} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>{right}</View> : null}
    </View>
  );
}

/** Uppercase section label, optional accent count (chamafacil .section-label). */
export function SectionLabel({ children, count, style }: { children: React.ReactNode; count?: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <Text style={{ fontSize: 12, fontWeight: t.headWeight, letterSpacing: 1, color: t.colors.ink3 }}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
      {count != null && (
        <Text style={{ fontSize: 12, fontWeight: t.headWeight, color: t.colors.accent }}>{count}</Text>
      )}
    </View>
  );
}

/** Horizontal row (chamafacil .row). */
export function Row({ children, style, gap = 13 }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** Category icon tile (chamafacil .cat-ic). */
export function CatIc({ name, size = 52, grad, iconSize }: { name: IconName; size?: number; grad?: boolean; iconSize?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: grad ? t.colors.accent : t.colors.accentSoft,
      }}
    >
      <Icon name={name} size={iconSize ?? Math.round(size * 0.5)} color={grad ? '#fff' : t.colors.accent} />
    </View>
  );
}

/** Vertical category tile with label (chamafacil CatTile). Accepts a custom icon node. */
export function CatTile({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 8 }}>
      {icon}
      <Text center weight="700" style={{ fontSize: 12.5, lineHeight: 15 }} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Big price with small currency (chamafacil .price). */
export function Price({ value, currency = 'R$', size = 22 }: { value: number | string; currency?: string; size?: number }) {
  const t = useTheme();
  // Numbers are formatted pt-BR (two decimals, comma) so a price like 103.2 reads
  // "103,20" instead of the JS default "103.2". Strings pass through untouched.
  const shown = typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value;
  return (
    <Text style={{ fontSize: size, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.4 }}>
      {/* One step lighter than the number, whatever the theme's head weight is —
          the contrast is the point, so it cannot just reuse `headWeight`. */}
      <Text style={{ fontSize: 13, fontWeight: t.headWeight === '800' ? '700' : '600', color: t.colors.ink2 }}>{currency} </Text>
      {value}
    </Text>
  );
}

/** Squared initials avatar (chamafacil .av-init). */
export function AvInit({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text weight="800" color="#fff" style={{ fontSize: 16 }}>
        {initials}
      </Text>
    </View>
  );
}

/** Read-only display field with tiny label + value (chamafacil .field .fl/.fv). */
export function FieldDisplay({ label, value, placeholder, minHeight }: { label: string; value?: string; placeholder?: string; minHeight?: number }) {
  const t = useTheme();
  const isPh = !value;
  return (
    <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.field, paddingHorizontal: 16, paddingVertical: 12, minHeight }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.ink3 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: isPh ? '500' : '600', color: isPh ? t.colors.ink3 : t.colors.ink, marginTop: 3 }}>
        {value || placeholder}
      </Text>
    </View>
  );
}

/** Step progress (nodes + bars) — compact inline variant (chamafacil .steps). */
export function Steps({ total, current }: { total: number; current: number }) {
  const t = useTheme();
  const nodes: React.ReactNode[] = [];
  for (let i = 1; i <= total; i++) {
    const done = i < current;
    const now = i === current;
    nodes.push(
      <View
        key={`n${i}`}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: done || now ? 0 : 1,
          borderColor: t.colors.line,
          backgroundColor: done ? t.colors.accent : now ? t.colors.accent : t.colors.surface2,
        }}
      >
        {done ? (
          <Icon name="check" size={13} color={t.colors.accentInk} />
        ) : (
          <Text weight="800" style={{ fontSize: 12, color: now ? '#fff' : t.colors.ink3 }}>
            {i}
          </Text>
        )}
      </View>,
    );
    if (i < total) {
      nodes.push(<View key={`b${i}`} style={{ width: 22, height: 2, backgroundColor: i < current ? t.colors.accent : t.colors.line }} />);
    }
  }
  return (
    // Hidden from screen readers on purpose. The digits inside the nodes are
    // drawing, not prose: read aloud they land in the middle of the card's label
    // as a bare "3, 4" — verified on device, where an in-progress tow announced
    // as "Guincho, … Urgente, 3, 4, Em atendimento". Every screen that shows a
    // stepper also shows the stage in words next to it, so nothing is lost.
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {nodes}
    </View>
  );
}

/** On/off pill toggle (chamafacil .toggle). */
export function Toggle({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: on ? t.colors.ok : t.colors.line, justifyContent: 'center' }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', marginLeft: on ? 23 : 3 }} />
    </View>
  );
}

/** "Suggested by chamafacil" pill (chamafacil .sugg-pill). */
export function SuggPill({ label, icon = 'sparkles' }: { label: string; icon?: IconName }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.accentSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: t.radius.btn }}>
      <Icon name={icon} size={12} color={t.colors.accent} fill="current" />
      <Text style={{ fontSize: 11.5, fontWeight: '800', color: t.colors.accent }}>{label}</Text>
    </View>
  );
}
