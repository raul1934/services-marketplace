# Tasks — start-code-modal-input

## 1. StartCodeModal component
- [x] 1.1 `apps/provider/src/components/StartCodeModal.tsx`: RN Modal with title + helper + `<OtpInput length={4}>` + confirm button (disabled until 4 digits / while pending) + cancel. Owns `code` + `useStartJob`; on success closes; on error shows the message.

## 2. Wire into the job screen
- [x] 2.1 `job/[id]/index.tsx`: for urgent accepted jobs the footer is a "Iniciar atendimento" button that opens the modal; scheduled keeps slide-to-start.
- [x] 2.2 Remove the inline start-code `Field` (and the now-unused `code`/`start` state on the screen / `Management`).
- [x] 2.3 Render `<StartCodeModal>` in the screen.

## 3. i18n
- [x] 3.1 Provider pt-BR + en-US: `job.startCodeTitle`, `job.startUrgentCta`, `job.confirmStart`.

## 4. Verify
- [x] 4.1 Typecheck provider app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19082): urgent accepted job #3 shows "Iniciar atendimento"; tapping opens a modal with 4 code cells; scheduled job has no code modal.
