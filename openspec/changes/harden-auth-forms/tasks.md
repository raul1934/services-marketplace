# Tasks — harden the auth forms

## 1. Defects first
- [ ] 1.1 Guard `slides[i]` in `welcome.tsx:176`; filter slides with missing translations (AUTH-14).
- [ ] 1.2 Remove the empty `<Text onPress>` with `flex:1` on the last slide (AUTH-09).
- [ ] 1.3 Point "Pular" at the guest home instead of `/register` (AUTH-09).

## 2. Phone (AUTH-11)
- [ ] 2.1 Add a pt-BR phone mask + validation to the phone field.
- [ ] 2.2 Stop hardcoding `'55' + digits`; normalise from the masked value.
- [ ] 2.3 `autoComplete="tel"` / `textContentType="telephoneNumber"`.
- [ ] 2.4 Manual check: typing with and without the country code both resolve to the same E.164 value.

## 3. Password (AUTH-12)
- [ ] 3.1 Reveal toggle on the password fields.
- [ ] 3.2 Minimum 8 + strength hint; confirmation field on register.
- [ ] 3.3 Align the backend validation rule with the new minimum.

## 4. Field polish (AUTH-04, AUTH-15)
- [ ] 4.1 Move the `AuthField` placeholder off `ink3` to a token that clears 4.5:1.
- [ ] 4.2 Wrap login in `KeyboardAvoidingView` (`login.tsx:51,93`) and confirm the password field is reachable with the keyboard open.

## 5. Google + env (AUTH-10, AUTH-17)
- [ ] 5.1 Render `GoogleButton` only when `webClientId` is configured; add role and disabled state.
- [ ] 5.2 Make the login `mode` default identical in dev and prod.

## 6. Close out
- [ ] 6.1 Device pass: register → verify → login, on both phone and e-mail paths.
- [ ] 6.2 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
