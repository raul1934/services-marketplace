/**
 * Feature flags. Each capability of the provider app sits behind its own flag so
 * the same binary can ship the on-demand marketplace, the field-service (B2B
 * contract) experience, or both — decided at runtime, not by forking the app.
 *
 * Values come from EXPO_PUBLIC_FLAG_* env vars (same pattern as config.ts); the
 * defaults below encode the current product decision (2026-07-24):
 *
 *   field_service ON, marketplace OFF
 *
 * i.e. the app runs standalone as the field operator tool, without the
 * marketplace surface. Flip a flag by setting its env var — e.g.
 * `EXPO_PUBLIC_FLAG_MARKETPLACE=true` — with no code change.
 */
function boolEnv(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export const flags = {
  /** Field-service / B2B contract mode: shifts, routes, sites, service orders. */
  field_service: boolEnv(process.env.EXPO_PUBLIC_FLAG_FIELD_SERVICE, true),
  /** On-demand marketplace: dashboard, nearby feed, bidding, jobs, agenda. */
  marketplace: boolEnv(process.env.EXPO_PUBLIC_FLAG_MARKETPLACE, false),
} as const;

export type FlagKey = keyof typeof flags;

/** True when the given feature is enabled in this build/runtime. */
export function isEnabled(flag: FlagKey): boolean {
  return flags[flag];
}

/**
 * Expo Router `href` helper for tab visibility: returns `undefined` to show the
 * tab (the router's default) or `null` to hide it from the bar — the same
 * mechanism the profile tab already uses to stay routable but off the bar.
 */
export function tabHref(flag: FlagKey): null | undefined {
  return flags[flag] ? undefined : null;
}
