# Tasks — close the POC gate and clear the dead weight

## 1. Auth gate (AR-01)
- [x] 1.1 Exemption removed outright: the `/medicao` POC was deleted (orphaned WebView prototype) and `/ar-medicao` is only reachable from authed asset screens.
- [x] 1.2 ~~Confirm a logged-out user hitting `/medicao` lands on welcome~~ — moot: the route is gone, so there is nothing to reach. Verified instead that the app boots clean with no exemption and the gate has no remaining special cases.

## 2. Dead code (PERF-02, CONS-06)
- [x] 2.1 Delete `stepOf` from `app/(tabs)/home.tsx:40-44` and simplify the `Steps` usage that reads it.
- [x] 2.2 72 unreachable keys removed from both locales. Detection had to account for dynamic prefixes that do not end in a dot, plural siblings i18next resolves from the base key, and arrays indexed by position. `tracking.call` kept on purpose (dormant "Ligar" action).
- [x] 2.3 `tsc --noEmit` clean for the customer app.

## 3. Routing (REQ-18, REQ-19)
- [x] 3.1 `+native-intent.ts` rewrites the legacy paths before routing. Note: Expo Router's declarative redirects render the same `<Redirect>`, so config alone would not have removed the frame.
- [x] 3.2 Add a header comment to `receipt.tsx` naming it a deep-link alias for the receipt notification.

## 4. ETA (CONS-03)
- [x] 4.1 The three customer surfaces already used `etaLabel`; the one escape was the provider bid summary formatting `~${eta} min` by hand.
- [x] 4.2 Verified — all callers now go through `etaLabel`.

## 5. Close out
- [x] 5.1 Set the six findings to `done` in `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit all three files.
