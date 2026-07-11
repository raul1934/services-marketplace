import * as SecureStore from 'expo-secure-store';
import { getLocales } from 'expo-localization';

/** Supported UI languages (label is the autonym, the same in any language). */
export const LANGUAGES = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en-US', label: 'English' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const KEY = 'ui_language';

/**
 * The device's preferred UI language mapped to a supported code. Used as the
 * initial language before any saved preference is applied. Portuguese devices
 * get pt-BR; everything else falls back to en-US.
 */
export function deviceLanguage(): LanguageCode {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'pt' ? 'pt-BR' : 'en-US';
  } catch {
    return 'en-US';
  }
}

/** The user's saved UI language, or null if none was chosen / on error. */
export async function loadSavedLanguage(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

/** Persist the chosen UI language (non-fatal on error). */
export async function persistLanguage(code: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, code);
  } catch {
    /* non-fatal — the language still applies for this session */
  }
}
