# Design — inline-proposals-on-open-request

## Component extraction
Move the body of `request/[id]/proposals.tsx` into a reusable
`apps/customer/src/components/ProposalsList.tsx`:

- Props: `{ requestId: number; budget?: number | null }`.
- Owns its own `sort` state, `useProposals(requestId, sort)`,
  `useAcceptProposal(requestId)`, and `useCancelRequest(requestId)`.
- Renders: the `SectionLabel` + `SortSeg`, the loading / empty / list states, the
  `ProposalCard`s, and the cancel-request link.
- `SortSeg` and `ProposalCard` move into this component (they are only used here).
- On accept: mutate then let query invalidation refresh — **no `router.replace`**.
  We are already on the request screen, so when the request query refetches with
  `status = accepted`, the same screen re-renders from the open layout (proposals
  list) into the active layout (live map + start code + provider card). The accept
  handler also invalidates `keys.events(requestId)` so the activity feed picks up
  the new `proposal_accepted` event (with the approved value) immediately, rather
  than waiting on the `status.updated` socket. On cancel: confirm, then
  `cancelRequest`; navigation back is unnecessary (the screen re-renders into the
  cancelled state).

## After accept (the screen morphs in place)
Because proposals are now part of the request screen, accepting is a state
transition on that screen — not a navigation:

1. `acceptProposal` succeeds → `keys.request(id)` + `keys.myRequests` +
   `keys.events(id)` invalidated.
2. The request refetches as `accepted`; `isActiveStatus` is now true, so the open
   branch (proposals) is replaced by the active branch (map + ETA + 4-step strip +
   provider card + start code), all already implemented on this screen.
3. The activity feed gains `proposal_accepted` and shows the approved value header.

No proposals UI is shown once the request leaves the open state.

This keeps the component free of `Screen`/`BackBar` chrome so it drops into the
open branch of the request screen.

## Request screen (`request/[id]/index.tsx`)
- Open branch: replace the `CustomerQna` + "Ver propostas (N)" button with
  `CustomerQna` followed by `<ProposalsList requestId={requestId} budget={request.budget_max} />`.
- Remove the now-unused `router.push(.../proposals)` and the
  `requestDetail.viewProposals` button usage.
- The event feed already renders at the bottom for all states, so the open screen
  becomes: category card → Q&A → proposals (inline) → activity feed.

## Redirect
`request/[id]/proposals.tsx` → `<Redirect href={`/request/${id}`} />` (same shape
as `track.tsx`). Keeps `/request/N/proposals` deep links / notifications working.

## Why a component, not inlining into index
`index.tsx` is already large and multi-state; a focused `ProposalsList` keeps the
"choose a proposal" concern in one file and avoids bloating the screen. It mirrors
the existing `ReceiptView` / `ReviewForm` inline components.

## No backend change
The `GET requests/{id}/proposals` endpoint, sorting, and accept endpoints are
untouched; only where the UI lives changes.
