# Design — start-code-only-when-urgent

## Source of truth: urgency
`urgency` (`urgent` | `scheduled`) is already on the request and exposed in both
apps' resources. The whole feature gates on `urgency === urgent`.

## Backend
- **`ProposalService` (accept).** Generate `start_code` only for urgent requests:
  ```php
  'start_code' => $request->urgency === RequestUrgency::Urgent
      ? str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT)
      : null,
  ```
  (The accept reads/has the request; use its urgency.)
- **`JobController@updateStatus`.** Block the plain start for urgent jobs so the
  code can't be skipped:
  ```php
  if ($target === RequestStatus::InProgress && $serviceRequest->urgency === RequestUrgency::Urgent) {
      abort(422, __('messages.start_code_required'));
  }
  ```
  Scheduled jobs continue to start via `updateStatus(in_progress)`.
- **`JobController@start`.** Unchanged — already requires `code` and verifies it
  against `start_code` before moving to `in_progress`. It is the only start path
  for urgent jobs now.
- **lang.** Add `messages.start_code_required` (pt + en).
- **`DevJobSeeder`.** Set the seeded `start_code` only for urgent matched jobs
  (keeps dev data consistent; scheduled seeded jobs get null).

## Provider app (`app/job/[id]/index.tsx`)
- **Show the field only for urgent.** `Management`: render the start-code field
  when `status === Accepted && request.urgency === RequestUrgency.Urgent`.
- **Required start.** In `JobScreen.onStart`:
  ```
  if (request.urgency === 'urgent') start.mutate(code.trim());   // server 422s if wrong
  else updateStatus.mutate(InProgress);                          // scheduled: no code
  ```
  The footer slide is disabled until a 4-digit code is present for urgent jobs:
  `disabled = start.isPending || (isUrgent && code.trim().length !== 4)`.
- **Copy.** `job.startCodeLabel` → "Código do cliente" (no "opcional");
  `job.startCodeHint` → states the code is required to start.

## Customer app
No code change. The "Código de início" card already renders only when
`request.start_code` exists; since scheduled jobs no longer get a code, it now
appears for urgent jobs only.

## Why server-enforced
Making the field required only in the UI would let a stale client / direct API
call bypass it. Blocking `accepted → in_progress` for urgent jobs in
`updateStatus` guarantees the code is the only way in.
