import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, loadSavedThemeMode, persistThemeMode } from '../lib/theme-pref';
import { Theme, ThemeName, themes } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  /** What the user chose: follow the system, or force light/dark. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initial = 'sunset',
}: {
  children: React.ReactNode;
  /** This app's brand palette — what light mode (and daylight `auto`) resolves to. */
  initial?: ThemeName;
}) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  // 'auto' is the honest starting point while the saved mode loads: it's the
  // default *and* it matches the OS, so the first frame can't flash a palette
  // the user didn't ask for.
  useEffect(() => {
    loadSavedThemeMode().then((saved) => {
      if (saved) setModeState(saved);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void persistThemeMode(next);
  }, []);

  // Modes, not palettes: which brand palette an app wears isn't the user's
  // choice (offering it let a client pick the provider's colors) — only
  // light-vs-dark is. `initial` is that app's brand palette.
  const dark = mode === 'dark' || (mode === 'auto' && scheme === 'dark');
  const themeName: ThemeName = dark ? 'night' : initial;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeName], themeName, mode, setMode }),
    [themeName, mode, setMode],
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
