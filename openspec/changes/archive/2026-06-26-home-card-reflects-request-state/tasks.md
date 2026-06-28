# Tasks — home-card-reflects-request-state

## 1. Card
- [x] 1.1 In `ActiveRequestCard` (`app/(tabs)/home.tsx`), compute `isOpen = status === RequestStatus.Open`.
- [x] 1.2 Badge: open → proposals-count (tone open); else → `enums.requestStatus.${status}` (tone live, dot).
- [x] 1.3 Footer: open → `home.reviewBids`; else → `home.trackRequest`.

## 2. i18n
- [x] 2.1 Add `home.trackRequest` to pt-BR ("Acompanhar atendimento") and en-US ("Track service").

## 3. Verify
- [x] 3.1 Typecheck customer app (0 new errors).
- [x] 3.2 Visual (Playwright @ :19083): with an accepted request, the home card shows a status badge (not "1 proposta(s)") and "Acompanhar atendimento" (not "Ver propostas"); an open request still shows the proposals badge + "Ver propostas".
