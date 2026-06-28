# Main-Flow Coverage Audit (walvee / guincho)

Reference: design folder `walvee/*.html` (screen index + flow map), V5 spec
`walvee/files/walvee-build-spec-v5.md`. Implementation: `frontend/apps/{customer,provider}`.

**Verdict:** the happy path is reachable end-to-end on both apps. Two steps in the
payment / start-of-service stretch were missing or reduced; both are addressed by
the `add-payment-receipt-and-checkin` change.

## Happy path — step → screen → status

| # | Step | Design ID | Status |
|---|------|-----------|--------|
| 1 | Onboard / login / tutorial | C01–C04, P01–P03 | ✅ |
| 2 | Home → category | C05, C06 | ✅ |
| 3 | Create request | C07, C08 | ✅ `request/new` |
| 4 | Published / blind auction | C09 | ✅ inline |
| 5 | Q&A both ways | C10/C11, P08 | ✅ inline |
| 6 | Provider bids | P09–P11 | ✅ now `job/[id]/bid` |
| 7 | Receive proposals → choose | C12–C14 | ✅ now `request/[id]/proposals` |
| 8 | En route / track | C15 | ✅ `request/[id]/track` |
| 9 | Start service (code) | C17, P14 | ⚠️→✅ optional `start_code` verify added |
| 10 | In progress + parts | C18/C19, P16/P17 | ✅ inline |
| 11 | Payment + receipt | **C20** | ❌→✅ `request/[id]/receipt` added |
| 12 | Mutual rating | C21, P18 | ✅ |
| 13 | Asset history | C22/C25 | ✅ |

## Gaps found

1. **C20 payment receipt (customer)** — was missing. Added a derived `settlement`
   block on the request resource + a `request/[id]/receipt` screen.
2. **C17/P14 start code** — start was a blind slide. Added a `start_code`
   (generated on accept), an optional verify endpoint `POST requests/{id}/start`,
   the code shown to the customer, and an optional code field on the provider start.
3. **C39 payment failure** — deferred: no payment gateway exists in the backend, so
   a failure/retry flow would be mock-only. Tracked as `add-payment-gateway`.
4. **C31 "lance aberto" (raise price when no bids)** — bad-path branch, not built.
   Tracked as a possible follow-up.

## Inline consolidation (reviewed, intentional)
Many V5 IDs (C13/C18/C29–C34, P12/P13) are inline states of the two `[id]/index`
screens. The two largest single-concern blocks were extracted (provider bid → P09,
customer proposals → C14); the rest stay inline as the active/manage view.
