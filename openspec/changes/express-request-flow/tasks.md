# Tasks — express and adaptive request creation

## 0. Baseline
- [ ] 0.1 Measure the current urgent flow on device: screens, taps, time-to-submit. Record in `ux-audit/user-journey.md`.

## 1. Unblock the funnel (REQ-01, ASSET-02)
- [ ] 1.1 Backend: `asset_id` optional on create-request; accept loose vehicle attributes.
- [ ] 1.2 App: remove the asset requirement for vehicle categories; plate/model inline and optional.
- [ ] 1.3 `assets/new.tsx:156-160` — nickname optional in picker mode.
- [ ] 1.4 Offer "salvar como meu veículo?" after submission, not before.
- [ ] 1.5 Confirm a brand-new account can submit a tow request with no asset.

## 2. Skip what has nothing to show (REQ-04)
- [ ] 2.1 A step with no questions/photos to render is not rendered (`new.tsx:382-391,428`).
- [ ] 2.2 Fold the photo-only step into a neighbouring step.
- [ ] 2.3 Make `Wiz`'s progress reflect the steps that will actually render, not a fixed total.

## 3. Express mode (REQ-02, REQ-09)
- [ ] 3.1 Define the minimum viable request in code: category + location + description.
- [ ] 3.2 One-screen express path for urgent requests.
- [ ] 3.3 Plain confirm button in express instead of the slide.
- [ ] 3.4 Post-submit enrichment on the tracking screen (photos, questions, budget, access).
- [ ] 3.5 Confirm providers see the request as soon as the minimum is met.

## 4. Adaptive fields (REQ-07 follow-through, REQ-08)
- [ ] 4.1 Field set per category; prefer server-driven so a new category needs no release.
- [ ] 4.2 Remove "ACESSO" and friends from roadside categories.
- [ ] 4.3 Fix the step-2 copy that promises a pin before a map exists.

## 5. Location (REQ-06, REQ-13)
- [ ] 5.1 Skeleton on the location card while GPS + reverse geocode run.
- [ ] 5.2 Resolve the address once and reuse it in step 2, review and the detail screen.
- [ ] 5.3 Confirm the same string appears on all three.

## 6. Verify
- [ ] 6.1 Re-measure the urgent persona; compare against the 0.1 baseline.
- [ ] 6.2 Walk the scheduled flow too — it must not have regressed.
- [ ] 6.3 Screenshots into `ux-audit/screens/`.

## 7. Close out
- [ ] 7.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
