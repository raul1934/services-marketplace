# Tasks — close the POC gate and clear the dead weight

## 1. Auth gate (AR-01)
- [x] 1.1 Exemption removed outright: the `/medicao` POC was deleted (orphaned WebView prototype) and `/ar-medicao` is only reachable from authed asset screens.
- [x] 1.2 ~~Confirm a logged-out user hitting `/medicao` lands on welcome~~ — moot: the route is gone, so there is nothing to reach. Verified instead that the app boots clean with no exemption and the gate has no remaining special cases.

## 2. Dead code (PERF-02, CONS-06)
- [x] 2.1 Delete `stepOf` from `app/(tabs)/home.tsx:40-44` and simplify the `Steps` usage that reads it.
- [ ] 2.2 Sweep `pt-BR.json`/`en-US.json` for keys never referenced in code; remove or wire.
- [x] 2.3 `tsc --noEmit` clean for the customer app.

## 3. Routing (REQ-18, REQ-19)
- [x] 3.1 `+native-intent.ts` rewrites the legacy paths before routing. Note: Expo Router's declarative redirects render the same `<Redirect>`, so config alone would not have removed the frame.
- [x] 3.2 Add a header comment to `receipt.tsx` naming it a deep-link alias for the receipt notification.

## 4. ETA (CONS-03)
- [ ] 4.1 Make `etaLabel` the only ETA formatter; delete the ad-hoc formatting in the proposal card, notification builder and tracking screen.
- [ ] 4.2 Verify the same request renders the same ETA string on all three surfaces.

## 5. Close out
- [ ] 5.1 Set the six findings to `done` in `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit all three files.
