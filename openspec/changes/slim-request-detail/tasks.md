# Tasks — slim the request screen

## 1. Map the current surface
- [ ] 1.1 List every conditional block in `index.tsx:383-571` with the condition that shows it.
- [ ] 1.2 Group them by stage (aberto / aceito / em atendimento / concluído).
- [ ] 1.3 Agree the target composition per stage before editing.

## 2. Stage-driven layout (REQ-03)
- [ ] 2.1 Render only the blocks belonging to the current stage.
- [ ] 2.2 Move exception entry points out of the main scroll (see `consolidate-exception-screens`).
- [ ] 2.3 Re-measure: blocks visible per stage, before and after.

## 3. Remove duplication (REQ-12, REQ-17, REQ-15)
- [ ] 3.1 One rendering per part; drop the inline/panel duplication (`:448-479` vs `:692-707`).
- [ ] 3.2 One amount; drop the two extra renderings (`:387`, `:685`).
- [ ] 3.3 Merge the context card into the header (`:329-348,357`).
- [ ] 3.4 Collapse the start code to a chip once `started_at` is set; hide it after.

## 4. Review (REQ-11)
- [ ] 4.1 Pick the single surface; remove the other two.
- [ ] 4.2 Delete the modal that reopens on focus and resets on reload.
- [ ] 4.3 Keep `rate.tsx` as a deep-link target only, documented as such.

## 5. List filtering (REQ-10)
- [ ] 5.1 Move the status filter to the server; drop `filteredCount` over loaded pages.
- [ ] 5.2 Confirm the count matches the real total.

## 6. Completion (REQ-16)
- [ ] 6.1 Decide the model; record it in the proposal with the reasoning.
- [ ] 6.2 Implement it end to end (backend state + customer action + settlement trigger).
- [ ] 6.3 Check the interaction with disputes and the warranty window.

## 7. Close out
- [ ] 7.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
