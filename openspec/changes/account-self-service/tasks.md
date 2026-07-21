# Tasks — account self-service

## 1. Data policy first (PROF-01)
- [ ] 1.1 Agree what account deletion does: hard delete, anonymise, or delete-with-retention.
- [ ] 1.2 Write down what is retained (finished jobs, invoices, disputes) and for how long.
- [ ] 1.3 Confirm it satisfies both store requirements and the LGPD.

## 2. Backend
- [ ] 2.1 `PATCH profile` (name, e-mail, phone, photo) with validation.
- [ ] 2.2 Change-password endpoint (current password required).
- [ ] 2.3 Account-deletion endpoint implementing the agreed policy.
- [ ] 2.4 Tests for each, including deletion side effects on open requests.

## 3. Customer app
- [ ] 3.1 Make the identity card tappable → edit profile.
- [ ] 3.2 Edit-profile screen with the shared field components.
- [ ] 3.3 Change-password flow.
- [ ] 3.4 Delete-account flow: explains consequences, requires an explicit confirmation, is not one tap.

## 4. Legal links (AUTH-08)
- [ ] 4.1 Terms and Privacy as real links with `accessibilityRole="link"`.
- [ ] 4.2 Point them at readable pages; confirm they open on device.

## 5. Locale and themes (PROF-05, PROF-04)
- [ ] 5.1 Call `setApiLocale` on language change (`profile.tsx:62-65`).
- [ ] 5.2 Verify a server-rendered notification arrives in the newly chosen language.
- [ ] 5.3 Decide on `trust`/`night`: expose in the picker or remove from `themes.ts`.

## 6. Close out
- [ ] 6.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
