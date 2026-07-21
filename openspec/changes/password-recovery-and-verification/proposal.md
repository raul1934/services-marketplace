# A way back into your own account

## Why

There is no "esqueci a senha" anywhere in the app. Not a broken link — nothing.
Anyone who registered with e-mail and password and forgets it is permanently
locked out, with no path except contacting support, which is also not offered. For
an app whose users show up in an emergency, this is the worst possible moment to
discover it.

The opposite door is too open. `register()` authenticates immediately and no
verification is ever sent, so accounts exist with unverified e-mail addresses and
we cannot tell a typo from a real address — including the address we would send a
password reset to.

The two combine into a trap the audit found separately: someone who registers with
e-mail only cannot log in by phone, because login offers an OTP path their account
cannot satisfy, and nothing warns them. The account works exactly once.

## What changes

- **AUTH-02** — password recovery end to end: a link on login, a request screen, a
  tokenised e-mail, a reset screen, expiry and single use.
- **AUTH-18** — e-mail verification after registration, with a resend, and a
  decision on what an unverified account may do.
- **AUTH-16** — settle the identity model: is the phone required, or is OTP by
  e-mail supported? Whatever the answer, the login screen must not offer a path the
  account cannot complete.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/(auth)/login.tsx` (link + mode logic), new
  request-reset / reset screens, `AuthProvider.tsx:70-80`, and backend endpoints
  plus mailables for reset and verification.
- **Findings**: AUTH-02 (Crítico), AUTH-18, AUTH-16.
- **Needs**: working transactional e-mail in every environment. Without it this
  ships as a dead end, which is worse than the current honest absence.
- **Security**: reset tokens are single-use and time-boxed; the request endpoint is
  rate-limited and answers identically for known and unknown addresses, so it
  cannot be used to enumerate accounts.
- **Depends on**: `harden-auth-forms` for the password rules, so recovery does not
  set a password the register screen would reject.
