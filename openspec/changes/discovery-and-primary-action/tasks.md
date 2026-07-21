# Tasks — persistent primary action and discovery

## 1. Decide the surface (NAV-01)
- [ ] 1.1 Choose centre tab vs global FAB; record the reasoning in the proposal.
- [ ] 1.2 Check the choice against every screen that pins a footer (request detail, wizard, exceptions) for collisions.

## 2. Implement it
- [ ] 2.1 Add the action to `app/(tabs)/_layout.tsx` (or a global overlay).
- [ ] 2.2 Verify it survives keyboard-open and the Android nav bar inset.
- [ ] 2.3 Target ≥44dp with a proper `accessibilityLabel`.

## 3. Empty-state onboarding (ASSET-01)
- [ ] 3.1 `FirstAssetTutorial` / `HomeAssets`: primary CTA becomes "pedir ajuda"; registering an asset becomes secondary and dismissable.
- [ ] 3.2 Confirm a brand-new account can reach the wizard without creating an asset.

## 4. Fastest path (HOME-02)
- [ ] 4.1 "Precisa de ajuda agora?" opens the wizard directly (category chosen inside), not `/categories`.
- [ ] 4.2 Count the taps before and after; record both.

## 5. Drawer (NAV-02)
- [ ] 5.1 Remove entries duplicated by the tabs/home.
- [ ] 5.2 Keep only what is unique; promote "pedir serviço" out of the hamburger.

## 6. Categories (HOME-03, HOME-04)
- [ ] 6.1 Add a search field at the top of `categories.tsx`.
- [ ] 6.2 Add empty + error states with retry.

## 7. Close out
- [ ] 7.1 Re-run the "aflito na estrada" persona walkthrough; record taps-to-request before/after in `ux-audit/user-journey.md`.
- [ ] 7.2 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
