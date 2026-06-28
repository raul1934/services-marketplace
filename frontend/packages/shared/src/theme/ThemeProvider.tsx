import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
  initial?: ThemeName;
}) {
  const [themeName, setThemeName] = useState<ThemeName>(initial);
  const setTheme = useCallback((name: ThemeName) => setThemeName(name), []);
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
