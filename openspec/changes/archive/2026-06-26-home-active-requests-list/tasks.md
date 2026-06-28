# Tasks — home-active-requests-list

## 1. Backend
- [x] 1.1 `RequestController@index`: add `availabilities` to the eager-load so the list resource carries scheduled dates.

## 2. Frontend — home list
- [x] 2.1 In `app/(tabs)/home.tsx`, replace the single `active` find with a derived candidate list (exclude completed/cancelled/expired).
- [x] 2.2 Rank: open+urgent (0) → open normal (1) → requote (2) → open+scheduled (3, by next date) → accepted/in_progress (4). Sort by rank, then date.
- [x] 2.3 Render at most 2 `ActiveRequestCard`s; show the section header only when there is ≥1 candidate.
- [x] 2.4 When candidates > 2, render a "Ver todos ({n})" button → `router.push('/(tabs)/requests')`.

## 3. i18n
- [x] 3.1 Add `home.seeAll` to pt-BR ("Ver todos ({{count}})") and en-US ("See all ({{count}})").

## 4. Verify
- [x] 4.1 Typecheck customer app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19083): home shows up to 2 cards in priority order (urgent/open first); with >2 candidates a "Ver todos" button appears and navigates to the Requests tab; with no open requests, scheduled/future ones surface.
