# Tasks — bid-send-success-splash

## 1. shared-ui
- [x] 1.1 Create `packages/shared/src/ui/SuccessSplash.tsx`: full-screen green overlay + animated (spring scale + fade) check, calls `onDone` after the entrance + a short hold. Export from `ui/index.ts`.

## 2. provider bid send
- [x] 2.1 `app/job/[id]/bid.tsx`: add a `sent` flag; on submit success set it (remove the alert), keep the error alert.
- [x] 2.2 Disable the slide once sent: `disabled: submit.isPending || sent`.
- [x] 2.3 Render `<SuccessSplash onDone={() => router.replace('/job/${requestId}')} />` over the wizard when `sent` (wrap in a flex container).

## 3. Verify
- [x] 3.1 Typecheck shared + provider app (0 new errors).
- [x] 3.2 Visual (Playwright @ :19082 provider): on an open request, complete the bid wizard and slide to send → green check animation appears, then the job screen shows "proposta enviada"; the slide cannot be triggered again.
