# Change: start-code-modal-input

## Why
The urgent-job start code is currently an inline single text field. A focused
4-cell modal (like the phone-OTP entry) reads as a deliberate "enter the code"
moment and is clearer than a field buried in the job body.

## What changes (in scope)
- For an urgent accepted job, the start action is a **"Iniciar atendimento"
  button** that opens a **modal** with a **4-cell code input** (reusing the
  shared `OtpInput`, length 4) + confirm. Entering the correct code starts the
  job; a wrong code shows an error in the modal.
- The inline start-code field is removed.
- Scheduled jobs are unchanged (slide-to-start, no code).

## Impact
- Module: `provider`.
- Frontend (`apps/provider`): new `src/components/StartCodeModal.tsx` (OtpInput
  length 4 + confirm, owns the code + `useStartJob`); `job/[id]/index.tsx` opens
  it from the urgent start button and drops the inline field. i18n: modal title +
  start button + confirm labels.
- No backend change (the verified `POST /start` endpoint is unchanged).
