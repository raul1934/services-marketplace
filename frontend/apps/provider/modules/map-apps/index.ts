import { Platform } from 'react-native';
import { requireNativeModule } from 'expo';

export type InstalledApp = { package: string; icon: string };

// Android-only native module. Wrapped so the app degrades gracefully when the
// native side isn't compiled in yet (before a rebuild) instead of throwing at
// import — callers just get [] and fall back.
let native: { getInstalled(packages: string[]): InstalledApp[] } | null = null;
if (Platform.OS === 'android') {
  try {
    native = requireNativeModule('MapApps');
  } catch {
    native = null;
  }
}

/**
 * Of the given package names, the ones installed on the device, each with its
 * real launcher icon as a PNG data URI. Empty when the module is unavailable
 * (iOS/web) or nothing matches.
 */
export function getInstalledMapApps(packages: string[]): InstalledApp[] {
  try {
    return native?.getInstalled(packages) ?? [];
  } catch {
    return [];
  }
}
