import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

export type AppKey = 'customer' | 'provider';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  url?: string;
  notes?: string;
}

/** Where the published native versions live (served by the landing/Caddy). */
const VERSION_URL = 'https://chamafacil.app/version.json';

/** True when `remote` is a higher semver than `local` (e.g. "1.2.0" > "1.1.9"). */
export function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split('.').map((n) => parseInt(n, 10) || 0);
  const l = local.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const a = r[i] ?? 0;
    const b = l[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

/** The installed native versionName (APK), falling back to the bundled app.json version. */
function currentVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * Checks `chamafacil.app/version.json` for a newer NATIVE build of `app` (a new
 * APK). Native changes (e.g. ViroReact) can't ship over-the-air, so when a higher
 * version is published there we surface an "update available" prompt that links to
 * the APK. Pure JS — no extra native module. JS-only changes are delivered
 * separately by expo-updates (OTA).
 */
export function useAppUpdate(app: AppKey): UpdateInfo {
  const [info, setInfo] = useState<UpdateInfo>({ available: false });

  useEffect(() => {
    let active = true;
    const local = currentVersion();
    // Cache-bust so a freshly published version.json is seen right away.
    fetch(`${VERSION_URL}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const entry = data?.[app];
        if (!active || !entry?.version || !entry?.url) return;
        if (isNewerVersion(String(entry.version), local)) {
          setInfo({
            available: true,
            version: String(entry.version),
            url: String(entry.url),
            notes: entry.notes ? String(entry.notes) : undefined,
          });
        }
      })
      .catch(() => {
        // Offline, or version.json not published yet — silently skip.
      });
    return () => {
      active = false;
    };
  }, [app]);

  return info;
}
