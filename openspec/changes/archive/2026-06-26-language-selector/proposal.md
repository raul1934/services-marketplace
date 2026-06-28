# Change: language-selector

## Why
Both apps support pt-BR and en-US, but the language is fixed to the device locale
at startup with no way to change it in-app. Users should be able to pick the
language, and have it stick across restarts.

## What changes (in scope)
- **Language selector in both apps' profile screens.** In the profile "App" /
  appearance area, a row of language options (Português / English) mirroring the
  theme buttons; the active language is highlighted. Selecting one switches the UI
  immediately (and updates the API locale, which already follows the language).
- **Persistence.** The chosen language is saved (expo-secure-store, like the auth
  token) and re-applied on next launch; if nothing is saved, the device locale is
  used as today.

## Deferred (NOT in this change)
- No new languages beyond the existing pt-BR / en-US.

## Impact
- Module: `shared-ui` (a small language helper, reused by both apps).
- Frontend: `packages/shared/src/lib/language.ts` (`LANGUAGES`, `persistLanguage`,
  `loadSavedLanguage`) exported from the barrel; each app's `src/i18n/index.ts`
  loads the saved language on init; each app's profile screen renders the selector
  (`i18n.changeLanguage` + `persistLanguage`). i18n: add `profile.language` (both
  apps, pt-BR + en-US).
- No backend change (the `X-Locale` header already tracks `i18n.language`).
