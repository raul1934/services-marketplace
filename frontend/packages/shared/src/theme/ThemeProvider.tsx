import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeName, themes } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initial = 'sunset',
}: {
  children: React.ReactNode;
  /** The light-mode theme for this app (used when the OS is in light mode). */
  initial?: ThemeName;
}) {
  // Follow the OS light/dark setting: light -> the app's light theme, dark -> 'night'.
  const scheme = useColorScheme();
  // A manual pick in the profile theme selector overrides the system scheme.
  const [override, setOverride] = useState<ThemeName | null>(null);
  const themeName: ThemeName = override ?? (scheme === 'dark' ? 'night' : initial);
  const setTheme = useCallback((name: ThemeName) => setOverride(name), []);
  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeName], themeName, setTheme }),
    [themeName, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx.theme;
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used within a ThemeProvider');
  return ctx;
}
