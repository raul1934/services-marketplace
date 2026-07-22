import React from 'react';
import { Platform, StyleSheet, Text as RNText, TextProps } from 'react-native';
import { useTheme } from '../theme';
import { manropeFor } from '../lib/fonts';

const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3 };

/**
 * The type scale: h1 28 · h2 22 · h3 17 · body 15 · mono 14 · label 13 · caption 12.
 *
 * DS-04 asks for this to be widened until inline `fontSize` disappears from the
 * UI kit, plus a lint rule to keep it gone. Measured before doing it: there are
 * 55 inline font sizes across 19 distinct values, including 11.5, 12.5, 13.5 and
 * 14.5 — and exactly **one** of them was a variant written longhand (fixed).
 * The other 54 are distinct size/weight/colour combinations.
 *
 * So widening `Variant` to absorb them means roughly thirty variants, which is
 * not a scale — it is the same sprawl with names on it. What this actually needs
 * is a decision about which sizes exist, after which the strays snap to them and
 * the lint rule has something to enforce. That is a design call, and it is the
 * same shape as the `ink3` contrast question in `themes.ts`.
 */
type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption' | 'mono';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  center?: boolean;
}

export function Text({ variant = 'body', color, weight, center, style, ...rest }: Props) {
  const t = useTheme();
  const base = {
    h1: { fontSize: 28, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.3 },
    h3: { fontSize: 17, fontWeight: '700' as const, color: t.colors.ink },
    body: { fontSize: 15, fontWeight: '500' as const, color: t.colors.ink, lineHeight: 21 },
    label: { fontSize: 13, fontWeight: '700' as const, color: t.colors.ink2 },
    // ink2 (~5.4:1 on surface) meets WCAG AA; ink3 (~2.6:1) did not.
    caption: { fontSize: 12, fontWeight: '600' as const, color: t.colors.ink2 },
    mono: { fontSize: 14, fontWeight: '600' as const, color: t.colors.ink, fontVariant: ['tabular-nums' as const] },
  }[variant];

  // Each Manrope weight is its own bundled family — pick it from the effective weight.
  const effWeight = weight ?? (base.fontWeight as string);

  // `body` pins lineHeight to 21, sized for its 15px default. A caller that
  // overrides fontSize (a 30px price, a 36px star) but not lineHeight would
  // otherwise render a big glyph inside a 21px line box, clipping anything
  // reaching past the x-height: "R$ 240,00" came out as "RS 240.00", losing the
  // $ bar and the comma tail, and ★ lost its points. Drop the inherited value
  // in that case and let the platform derive one from the actual font size.
  const flat = StyleSheet.flatten(style) as { fontSize?: number; lineHeight?: number } | undefined;
  const resolved =
    flat?.fontSize != null && flat?.lineHeight == null && 'lineHeight' in base
      ? { ...base, lineHeight: undefined }
      : base;

  // Expose heading semantics (role + level) to assistive tech on web.
  const level = HEADING_LEVEL[variant];
  const headingProps: any = level
    ? { accessibilityRole: 'header', ...(Platform.OS === 'web' ? { 'aria-level': level } : {}) }
    : {};

  return (
    <RNText
      {...headingProps}
      {...rest}
      style={[
        resolved,
        variant === 'mono'
          ? { fontFamily: Number(effWeight) >= 700 ? 'SpaceMono_700Bold' : 'SpaceMono_400Regular' }
          : { fontFamily: manropeFor(effWeight) },
        color ? { color } : null,
        weight ? { fontWeight: weight } : null,
        center ? styles.center : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
