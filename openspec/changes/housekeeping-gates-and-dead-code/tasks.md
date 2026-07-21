# Tasks — close the POC gate and clear the dead weight

## 1. Auth gate (AR-01)
- [ ] 1.1 Remove `medicao`/`ar-medicao` from the `exempt` check in `app/_layout.tsx:79`, or wrap it in `__DEV__`.
- [ ] 1.2 Confirm on device that a logged-out user hitting `/medicao` lands on welcome.

## 2. Dead code (PERF-02, CONS-06)
- [ ] 2.1 Delete `stepOf` from `app/(tabs)/home.tsx:40-44` and simplify the `Steps` usage that reads it.
- [ ] 2.2 Sweep `pt-BR.json`/`en-US.json` for keys never referenced in code; remove or wire.
- [ ] 2.3 `tsc --noEmit` clean for the customer app.

## 3. Routing (REQ-18, REQ-19)
- [ ] 3.1 Turn `proposals.tsx` and `track.tsx` into router-level redirects (no rendered frame).
- [ ] 3.2 Add a header comment to `receipt.tsx` naming it a deep-link alias for the receipt notification.

## 4. ETA (CONS-03)
- [ ] 4.1 Make `etaLabel` the only ETA formatter; delete the ad-hoc formatting in the proposal card, notification builder and tracking screen.
- [ ] 4.2 Verify the same request renders the same ETA string on all three surfaces.

## 5. Close out
- [ ] 5.1 Set the six findings to `done` in `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit all three files.
