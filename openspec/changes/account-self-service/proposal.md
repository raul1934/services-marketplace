# Let people manage their own account

## Why

The profile screen shows who you are and lets you change almost nothing. There is
no way to edit your name, e-mail, phone, photo or password, and **no way to delete
your account** — which is not merely a gap in self-service, it is a requirement of
both app stores and a data-protection obligation under the LGPD. The identity card
at the top is not even tappable, so the screen reads as a dead end.

Adjacent to it, "Concorda com os Termos e a Política de Privacidade" on register is
**plain text**. There is nothing to open and nothing to read, on the screen where
consent is being collected.

Two smaller ones live here too: the theme picker exposes only light/dark/auto while
the `trust` and `night` palettes exist unreachable, and changing the language
persists the choice locally without calling `setApiLocale`, so the backend keeps
sending the previous language — the split we already saw when notifications came
through in English.

## What changes

- **PROF-01** — an edit-profile screen (name, e-mail, phone, photo), a change-
  password flow, and account deletion with a real confirmation and a documented
  server-side data policy.
- **AUTH-08** — Terms and Privacy become real links with `accessibilityRole="link"`,
  opening readable pages.
- **PROF-05** — call `setApiLocale` when the language changes, so server-rendered
  strings follow the app.
- **PROF-04** — decide on the extra palettes: expose them or remove them. Shipping
  dead themes is its own kind of debt.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/(tabs)/profile.tsx` (and new edit/password/delete
  screens), `app/(auth)/register.tsx`, `packages/shared/src/lib/language.ts`,
  plus backend endpoints for profile update and account deletion.
- **Findings**: PROF-01, AUTH-08, PROF-04, PROF-05.
- **Legal**: account deletion needs a stated policy — what is deleted, what is
  retained for tax/dispute reasons, and how long. Decide that with the product
  owner before implementing; it is not an engineering choice.
- **Out of scope**: provider-side account management.
