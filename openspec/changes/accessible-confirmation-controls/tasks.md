# Tasks — accessible confirmation controls

## 1. SlideToConfirm (A11Y-01)
- [ ] 1.1 Add `accessibilityRole`, label and `accessibilityActions` (activate) to the component.
- [ ] 1.2 Detect an active screen reader and render an equivalent `Button` alternative.
- [ ] 1.3 Apply at all three call sites: accept proposal, approve surcharge, approve re-quote.
- [ ] 1.4 TalkBack: accept a proposal end to end.

## 2. BudgetMeter (A11Y-02)
- [ ] 2.1 `accessibilityRole="adjustable"` + `accessibilityValue` (`min`, `max`, `now`).
- [ ] 2.2 Handle increment/decrement actions from the reader.
- [ ] 2.3 TalkBack: set a budget in the wizard without touching the SVG.

## 3. Toggle → switch (DS-07)
- [ ] 3.1 Rewrite `Toggle` on `Pressable` with `onValueChange`, `accessibilityRole="switch"`, `accessibilityState={{ checked }}`.
- [ ] 3.2 Update `new.tsx:303` (share asset note) and any other call site.
- [ ] 3.3 Confirm the visual state still matches the theme in light and dark.

## 4. Close out
- [ ] 4.1 Record the TalkBack pass (what works now, what still does not) in `ux-audit/accessibility.md`.
- [ ] 4.2 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
