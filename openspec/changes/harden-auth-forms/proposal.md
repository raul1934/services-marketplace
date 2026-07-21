# Harden the auth forms

## Why

The auth screens are the first thing a new user touches and they are full of small
traps. The phone field accepts anything, has no mask, and hardcodes `'55' + digits`
— so a user who types their country code gets `5555…` and a login that silently
never matches. The password field has no reveal toggle and a six-character minimum
with no strength feedback or confirmation, on a screen where a typo cannot be seen.

Two are outright defects: `welcome.tsx:176` indexes `slides[i].title` with no
guard, so an incomplete translation crashes the first screen of the app; and the
last onboarding slide has an empty `<Text>` with `onPress` and `flex: 1`, which is
an invisible tap target covering the screen. "Pular" on onboarding goes to
**register**, which is the opposite of skipping.

The rest is friction: no `KeyboardAvoidingView` on login (the wizard got one, login
did not), `GoogleButton` renders even when no `webClientId` is configured — an
alley that can only end in an error — and the login `mode` default differs between
dev and prod, so we test a path the user never takes.

## What changes

- **AUTH-11** — mask and validate the phone; derive the country code instead of
  prefixing `'55'`; add `autoComplete="tel"`.
- **AUTH-12** — reveal toggle, minimum of 8 with live strength feedback, and a
  confirmation field on register.
- **AUTH-14** — guard `slides[i]`; filter out entries whose translation is missing,
  the way `FirstAssetTutorial` already does.
- **AUTH-09** — "Pular" goes to the guest home, not to register; delete the empty
  full-screen `<Text onPress>`.
- **AUTH-10** — hide `GoogleButton` when Google sign-in is not configured; give it
  a role and a disabled state.
- **AUTH-15** — `KeyboardAvoidingView` on login (the wizard fix did not cover it).
- **AUTH-17** — one default for `mode`, dev and prod alike.
- **AUTH-04** — finish the field work: the persistent label landed, the placeholder
  is still `ink3` at ~2.6:1.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/(auth)/welcome.tsx`, `login.tsx`, `register.tsx`,
  `verify.tsx`, `src/components/AuthField.tsx`, `GoogleButton.tsx`,
  `src/useGoogleSignIn.ts`.
- **Findings**: AUTH-09, AUTH-10, AUTH-11, AUTH-12, AUTH-14, AUTH-15 (partial),
  AUTH-17, AUTH-04 (partial).
- **Out of scope**: password recovery and e-mail verification, which are features
  rather than hardening — see `password-recovery-and-verification`.
