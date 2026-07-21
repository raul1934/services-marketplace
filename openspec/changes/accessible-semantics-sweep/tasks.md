# Tasks — names, roles and targets

## 1. Shared UI primitives
- [ ] 1.1 `IconButton`: require an i18n `accessibilityLabel`; stop defaulting to the icon name (A11Y-09).
- [ ] 1.2 `Card`: when `onPress` is set, expose `accessibilityRole="button"` and an aggregated label (A11Y-12).
- [ ] 1.3 `Badge dot` and the unread dot: add a textual equivalent (A11Y-14).
- [ ] 1.4 `DividerOr`, `BrandMark`: mark decorative (A11Y-13).
- [ ] 1.5 `Wiz` back and `BackBar`: role + label (A11Y-09).
- [ ] 1.6 `Segment`: `accessibilityState={{ selected }}` + role (A11Y-06).

## 2. Text-as-button sweep (A11Y-04)
- [ ] 2.1 `welcome.tsx:189`, `login.tsx:96`, `register.tsx:62`, `verify.tsx:78`.
- [ ] 2.2 `request/[id]/index.tsx:469`, `ProposalsList.tsx:387-392`, `ReviewForm.tsx:89`.
- [ ] 2.3 Each becomes a `Pressable`/`Button` with role and ≥44dp effective target.

## 3. Selection state (A11Y-05, A11Y-06)
- [ ] 3.1 `AssetSelector.tsx:44,57` — role, label, `selected`.
- [ ] 3.2 `DynamicFields.tsx:63` chips — role, `selected`.

## 4. Touch targets (A11Y-10)
- [ ] 4.1 `notifications.tsx:39` "marcar todas" (~29px).
- [ ] 4.2 Sheet close button (~38px).
- [ ] 4.3 `new.tsx:437` remove-photo (24px).
- [ ] 4.4 `DatePicker.tsx:72` nav buttons (30px, no hitSlop).

## 5. Decorative content (AUTH-07, A11Y-13)
- [ ] 5.1 `welcome.tsx:52-132` — `importantForAccessibility="no-hide-descendants"` on the illustration, one label on the scene.

## 6. Forms and focus (A11Y-07, A11Y-11, A11Y-08)
- [ ] 6.1 `Field.tsx:88-90` / `AuthField.tsx:42` — associate the error with the input and announce it via a live region.
- [ ] 6.2 `OtpInput.tsx:47-57` — label the hidden input, group the six boxes, change the border on error.
- [ ] 6.3 Extend `focusRing` (`a11y.ts:9-13`) beyond web and apply it to sheets, `PickerField`, `BackBar`, `Wiz` and "marcar todas".
- [ ] 6.4 Submit each form with an invalid value and confirm the reader says what is wrong.

## 7. Verify on device
- [ ] 7.1 TalkBack walkthrough: login → create request → proposals → accept → tracking. Record what still reads wrong.
- [ ] 7.2 Screenshot/notes into `ux-audit/screens/`.

## 8. Close out
- [ ] 8.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
