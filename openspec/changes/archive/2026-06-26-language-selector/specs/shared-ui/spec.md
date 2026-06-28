# shared-ui

## ADDED Requirements

### Requirement: In-app language selection that persists
Both apps SHALL let the user choose the UI language (Português / English) from the
profile screen. Selecting a language SHALL switch the UI immediately and persist
the choice (re-applied on next launch). When no language has been saved, the
device locale SHALL be used (current behavior). The shared UI SHALL provide the
language list and the load/persist helpers used by both apps.

#### Scenario: Switch language from profile
- WHEN the user selects "English" on the profile language selector
- THEN the UI copy switches to English and "English" is highlighted as active

#### Scenario: Language persists across restarts
- WHEN the user has chosen a language and reopens the app
- THEN the app starts in the chosen language rather than the device locale
