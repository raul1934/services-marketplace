# Tasks — language-selector

## 1. Shared helper
- [x] 1.1 `packages/shared/src/lib/language.ts`: `LANGUAGES` ([{code:'pt-BR',label:'Português'},{code:'en-US',label:'English'}]), `persistLanguage(code)` + `loadSavedLanguage()` via expo-secure-store. Export from the barrel.

## 2. Apply saved language on init
- [x] 2.1 Customer + provider `src/i18n/index.ts`: after init, `loadSavedLanguage()` and `changeLanguage` if a value is stored (keeps device-locale default otherwise).

## 3. Selector in both profiles
- [x] 3.1 Customer profile: add a language selector (Português / English) in the appearance card; `i18n.changeLanguage(code)` + `persistLanguage(code)`, highlight `i18n.language`.
- [x] 3.2 Provider profile: same selector in its App section.
- [x] 3.3 i18n: add `profile.language` to customer + provider (pt-BR + en-US).

## 4. Verify
- [x] 4.1 Typecheck shared + both apps (0 new errors).
- [x] 4.2 Visual (Playwright): on the customer and provider profile, the language selector shows; tapping "English" switches visible copy to English (e.g. the profile title), and the active option is highlighted.
