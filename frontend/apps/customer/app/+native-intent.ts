/**
 * Rewrites legacy deep links before the router mounts anything.
 *
 * `/request/[id]/proposals` and `/request/[id]/track` were folded into the
 * unified request screen. Their route files survive as `<Redirect>` so old
 * in-app links still resolve — but a redirect route has to mount a frame before
 * it can bounce, which reads as a flash. Expo Router's own declarative redirects
 * are built on that same `<Redirect>`, so moving the config would not have
 * helped; intercepting the path here does, because it happens before routing.
 *
 * This is the case that actually matters: these routes exist for notification
 * deep links, which is exactly the traffic that comes through native intent.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return path.replace(/(\/request\/[^/?#]+)\/(?:proposals|track)(?=$|[?#])/, '$1');
}
