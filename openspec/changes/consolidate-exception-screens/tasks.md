# Tasks — consolidate the exception screens

## 1. Fix the defect first (EXC-01)
- [ ] 1.1 Replace the ISO-text date `Field` in `reschedule.tsx:36,72` with a native date picker.
- [ ] 1.2 Remove the `^\d{4}-\d{2}-\d{2}$` regex validation.
- [ ] 1.3 TalkBack: pick a date without typing.

## 2. Group A → inline sheets (EXC-02)
- [ ] 2.1 Confirm `<Sheet>` exists (`design-system-foundations`).
- [ ] 2.2 Surcharge → sheet on the request screen.
- [ ] 2.3 Re-quote → sheet.
- [ ] 2.4 Reschedule → sheet (carrying the new date picker).
- [ ] 2.5 No-show → sheet.
- [ ] 2.6 Delete the inline cards whose only purpose was to push a route.
- [ ] 2.7 Keep the routes as deep-link targets for notifications, redirecting into the sheet.

## 3. Group B → `ClaimForm` (EXC-02, EXC-05)
- [ ] 3.1 Extract `ClaimForm` (title, description, photos with add **and remove**, submit).
- [ ] 3.2 Dispute uses it — fixing the missing photo removal (`dispute.tsx:73`).
- [ ] 3.3 Warranty uses it (`warranty.tsx:102-159`).

## 4. Navigation and polish (EXC-03, EXC-06, EXC-07)
- [ ] 4.1 One destination for a price change; remove the `tier === 'requote'` redirect (`surcharge.tsx:38,121-124`).
- [ ] 4.2 Replace the 🕒 emoji in `no-show.tsx:39` with the icon system.
- [ ] 4.3 Pin the reschedule submit footer (`reschedule.tsx:80`).
- [ ] 4.4 Confirm every exception ends in the same success feedback.

## 5. Verify
- [ ] 5.1 Walk each of the six flows on the device from the seeded sandbox.
- [ ] 5.2 Confirm the notification deep-links still land correctly.

## 6. Close out
- [ ] 6.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
