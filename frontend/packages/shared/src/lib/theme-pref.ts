import * as SecureStore from 'expo-secure-store';

/**
 * What the user picks, which is *not* a theme name.
 *
 * Themes are brand palettes ('sunset' for the client, 'trust' for the provider,
 * 'night' for dark). Which brand palette applies is the app's business, not a
 * choice — offering it let a client pick the provider's colors. So the picker
 * offers modes, and each app maps `light` to its own palette.
 */
export type ThemeMode = 'auto' | 'light' | 'dark';

export const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

const KEY = 'ui_theme';

function isMode(v: string | null): v is ThemeMode {
  return v === 'auto' || v === 'light' || v === 'dark';
}

/** The saved mode, or null when none was chosen / on error. */
export async function loadSavedThemeMode(): Promise<ThemeMode | null> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    return isMode(v) ? v : null;
  } catch {
    return null;
  }
}

/** Persist the chosen mode (non-fatal on error). */
export async function persistThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, mode);
  } catch {
    /* non-fatal — the mode still applies for this session */
  }
}
