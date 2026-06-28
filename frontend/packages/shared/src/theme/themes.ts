/**
 * Walvee theme tokens — ported from walvee-ui.css (.t-sunset / .t-trust / .t-night).
 * CSS custom properties become a typed theme object consumed by the shared UI kit
 * via ThemeProvider / useTheme(). Gradients are expressed as ordered color-stop
 * arrays for use with expo-linear-gradient.
 */

export type ThemeName = 'sunset' | 'trust' | 'night';

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Theme {
  name: ThemeName;
  dark: boolean;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    ink: string;
    ink2: string;
    ink3: string;
    line: string;
    line2: string;
    accent: string;
    accent2: string;
    accentInk: string;
    accentSoft: string;
    ok: string;
    okSoft: string;
    danger: string;
    dangerSoft: string;
    warn: string;
    statusbarInk: string;
  };
  /** Diagonal gradient color stops (top-left -> bottom-right). */
  grad: readonly string[];
  gradSoft: readonly string[];
  radius: { card: number; btn: number; field: number };
  shadow: ThemeShadow;
  shadowSm: ThemeShadow;
  font: { body: string; head: string; mono: string };
  /** Heading font weight (RN expects a string). */
  headWeight: '700' | '800';
}

export const sunset: Theme = {
  name: 'sunset',
  dark: false,
  colors: {
    bg: '#eef2f7',
    surface: '#ffffff',
    surface2: '#f6f8fc',
    ink: '#15233b',
    ink2: '#5b6b82',
    ink3: '#95a2b6',
    line: '#e7ecf3',
    line2: '#eef2f7',
    accent: '#ff6a3d',
    accent2: '#ffb23e',
    accentInk: '#ffffff',
    accentSoft: '#fff0ea',
    ok: '#12b981',
    okSoft: '#e3f7ef',
    danger: '#f0455b',
    dangerSoft: '#fdebee',
    warn: '#f59e0b',
    statusbarInk: '#15233b',
  },
  grad: ['#ff8a4c', '#ff5a6e', '#ffb23e'],
  gradSoft: ['#fff4ec', '#ffeef0'],
  radius: { card: 22, btn: 999, field: 16 },
  shadow: { shadowColor: '#14233b', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 9 },
  shadowSm: { shadowColor: '#14233b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 3 },
  font: { body: 'Manrope', head: 'Manrope', mono: 'Space Mono' },
  headWeight: '800',
};

export const trust: Theme = {
  name: 'trust',
  dark: false,
  colors: {
    bg: '#f3f6fa',
    surface: '#ffffff',
    surface2: '#f9fbfd',
    ink: '#0b1220',
    ink2: '#55627a',
    ink3: '#93a0b5',
    line: '#e4e9f1',
    line2: '#eef2f7',
    accent: '#4f46e5',
    accent2: '#0ea5a5',
    accentInk: '#ffffff',
    accentSoft: '#ecebfd',
    ok: '#0ea5a5',
    okSoft: '#e2f6f6',
    danger: '#e11d48',
    dangerSoft: '#fde7ec',
    warn: '#d97706',
    statusbarInk: '#0b1220',
  },
  grad: ['#6258f5', '#4f46e5'],
  gradSoft: ['#f0effe', '#eafafa'],
  radius: { card: 16, btn: 12, field: 12 },
  shadow: { shadowColor: '#0b1220', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 6 },
  shadowSm: { shadowColor: '#0b1220', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  font: { body: 'Manrope', head: 'Manrope', mono: 'Space Mono' },
  headWeight: '700',
};

export const night: Theme = {
  name: 'night',
  dark: true,
  colors: {
    bg: '#0a0d14',
    surface: '#141a25',
    surface2: '#1b2330',
    ink: '#eef2f8',
    ink2: '#9aa7b8',
    ink3: '#5f6c7e',
    line: '#232d3b',
    line2: '#1b2330',
    accent: '#ff6a3d',
    accent2: '#ffb000',
    accentInk: '#0a0d14',
    accentSoft: '#2a1c18',
    ok: '#2bd576',
    okSoft: '#11261d',
    danger: '#ff5470',
    dangerSoft: '#2a1620',
    warn: '#ffb000',
    statusbarInk: '#eef2f8',
  },
  grad: ['#ff7a45', '#ff4d6d', '#ffb000'],
  gradSoft: ['#221a18', '#1d1614'],
  radius: { card: 22, btn: 999, field: 16 },
  shadow: { shadowColor: '#000000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12 },
  shadowSm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 5 },
  font: { body: 'Manrope', head: 'Manrope', mono: 'Space Mono' },
  headWeight: '800',
};

export const themes: Record<ThemeName, Theme> = { sunset, trust, night };
