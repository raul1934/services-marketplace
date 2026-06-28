# Change: start-code-only-when-urgent

## Why
The start-of-service code (the 4-digit code the customer reads to the provider on
arrival) is currently generated for every accepted job and is optional for the
provider. It only makes sense for **urgent** (help-now) jobs, where confirming the
provider physically arrived matters. For scheduled jobs it's noise. And when it
does apply, leaving it optional defeats the point — the provider can start without
proving arrival.

## What changes (in scope)
- **Code only for urgent jobs.** A `start_code` is generated only when the
  accepted request is `urgent`. Scheduled jobs get no code; the customer card and
  the provider field don't appear for them.
- **Required for urgent jobs.** For urgent jobs the provider can only move
  `accepted → in_progress` by entering the customer's correct code. The plain
  status-bump path is blocked server-side for urgent jobs (must go through the
  verified `start` endpoint). Scheduled jobs start via the existing slide, no code.
- **Copy.** The provider field is relabelled from "(opcional)" to a required field.

## Deferred (NOT in this change)
- No change to how the code is displayed to the customer beyond it now only
  showing for urgent jobs (already conditional on the code's presence).

## Impact
- Module: `provider` (start flow) + `customer` (code display gated to urgent).
- Backend: `ProposalService` generates `start_code` only for urgent accepts;
  `JobController@updateStatus` rejects `accepted → in_progress` for urgent jobs
  (forces `/start`); new `messages.start_code_required`; `DevJobSeeder` seeds the
  code only for urgent jobs.
- Frontend (`apps/provider`): the start-code field shows only for urgent accepted
  jobs and is required (slide-to-start disabled until 4 digits → verified start);
  scheduled jobs start with no code. i18n: relabel `job.startCode*`.
- Customer app: no code change — the existing "Código de início" card already only
  renders when a `start_code` exists, so it now appears for urgent jobs only.
