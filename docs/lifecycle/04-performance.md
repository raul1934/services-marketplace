# 4. Performance

Everything between "accepted" and "completed": starting the job, live
tracking, parts, surcharges, and the side-flows that can interrupt it
(no-show, reschedule, requote).

## Status machine

```mermaid
stateDiagram-v2
    [*] --> Open
    Open --> Accepted: customer accepts a proposal
    Accepted --> InProgress: urgent — provider enters start code\nscheduled — direct status update
    InProgress --> Completed: provider marks complete (settles earnings)
    InProgress --> Requote: surcharge over 50% of agreed price
    Requote --> InProgress: customer accepts new total
    Requote --> Open: customer reopens to other providers
    Accepted --> Open: no-show reported / reschedule declined
    InProgress --> Open: no-show reported
    Open --> Cancelled: customer cancels
    Open --> Expired: enum exists — nothing ever triggers this
    Completed --> [*]
```

## Start-of-service code

```mermaid
sequenceDiagram
    participant Svc as ProposalService (on accept)
    participant P as Provider App
    participant API as JobController

    Svc->>Svc: urgency==Urgent → generate 4-digit start_code (never sent to provider)
    P->>API: POST /requests/{id}/start {code}
    API->>API: hash_equals(stored_code, code)
    alt match
        API->>API: status=InProgress, started_at=now()
        API-->>P: 200 OK
    else mismatch
        API-->>P: 422 invalid_start_code
    end
    Note over API: Scheduled jobs skip this entirely —\nPUT /requests/{id}/status works directly, no code required
```

## Live tracking

```mermaid
sequenceDiagram
    participant P as Provider App
    participant API as ProviderController
    participant Reverb as Reverb (request.{id} channel)
    participant C as Customer App

    loop while status in [Accepted, InProgress]
        P->>API: PUT /provider/location {lat, lng, accuracy}
        API->>API: upsert provider_locations
        API->>Reverb: broadcast .location.updated
        Reverb-->>C: live marker update
    end
    Note over C: Fallback — GET /requests/{id}/provider-location\npolled if Reverb is unavailable
```

## Parts & surcharges

```mermaid
flowchart TD
    subgraph Parts
        P1[Provider logs a part — no approval needed to add] --> P2[Provider requests approval of running total]
        P2 --> P3[Customer approves]
        P3 --> P4[Counted in settlement]
    end
    subgraph Surcharges
        S1[Provider proposes surcharge + photo evidence] --> S2{Cumulative % of agreed price}
        S2 -->|"up to 15%: Simple"| S3[Customer slide-to-approve, no gate]
        S2 -->|"15-50%: Reinforced"| S4[Customer explicit approve/refuse]
        S2 -->|"over 50%: Requote"| S5[Job pauses — see Response doc]
    end
```

## No-show & completion

```mermaid
sequenceDiagram
    participant C as Customer App
    participant API as RequestController / JobController
    participant Svc as RequestService

    alt No-show (customer-initiated only)
        C->>API: POST /requests/{id}/no-show {reason?}
        API->>Svc: reportNoShow
        Svc->>Svc: status=Open, clears accepted_* fields, no_show_at set
        Svc->>Svc: redispatch to other providers
        Note over Svc: provider reputation penalty is "back-office" — no in-app code
    else Completion
        C->>API: (provider side) PUT /requests/{id}/status {completed}
        API->>Svc: updateStatus(Completed)
        Svc->>Svc: completed_at=now()
        Svc->>Svc: settleEarnings — idempotent, skips if a credit already exists
        Svc->>Svc: gross = labor + parts + approved surcharges
        Svc->>Svc: net = gross × (1 − commission), commission by plan: Free 5% / Pro 2.5% / Enterprise 1%
        Svc->>Svc: WalletTransaction(CREDIT, net) + jobs_completed++
    end
```

## Known gaps

- **`RequestStatus::Expired` is dead code** — defined in the enum, never
  assigned anywhere.
- **No-show is customer-initiated only** — there's no symmetric provider
  "customer no-show" report.
- **Provider reputation penalty on no-show is undocumented in code** — the
  comment says "back-office reputation pipeline" but nothing in this repo
  implements it.
- **Parts require no approval to *add*, only to *total*.** A provider could
  log an arbitrarily large parts list and the customer only sees it when
  approval is explicitly requested — there's no line-item approval, only an
  aggregate one.
