# Tasks — start-code-only-when-urgent

## 1. Backend
- [x] 1.1 `ProposalService` accept: generate `start_code` only when `urgency === Urgent`, else null.
- [x] 1.2 `JobController@updateStatus`: reject `accepted → in_progress` when `urgency === Urgent` (abort 422 `messages.start_code_required`) so urgent jobs must use `/start`.
- [x] 1.3 Add `messages.start_code_required` to `lang/pt` + `lang/en`.
- [x] 1.4 `DevJobSeeder`: set `start_code` only for urgent matched jobs.

## 2. Provider app
- [x] 2.1 `job/[id]/index.tsx`: show the start-code field only when `status === Accepted && urgency === Urgent`.
- [x] 2.2 Required start: `onStart` uses verified `start.mutate(code)` for urgent, plain `updateStatus(InProgress)` for scheduled; slide disabled until 4 digits when urgent.
- [x] 2.3 i18n: relabel `job.startCodeLabel` (drop "opcional") + `job.startCodeHint` (required to start), pt-BR + en-US.

## 3. Verify
- [x] 3.1 Feature test: urgent accept generates a code and `updateStatus(in_progress)` is 422 (must use `/start`); scheduled accept generates no code and starts via `updateStatus`; wrong code 422, correct code starts.
- [x] 3.2 Typecheck provider app (0 new errors).
- [x] 3.3 Visual (Playwright @ :19082 provider): urgent accepted job shows the required code field + disabled slide until 4 digits; scheduled accepted job has no code field and starts via slide.
