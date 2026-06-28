# Tasks — inline-proposals-on-open-request

## 1. Extract the proposals UI
- [x] 1.1 Create `apps/customer/src/components/ProposalsList.tsx` from `request/[id]/proposals.tsx` (SectionLabel + SortSeg, loading/empty/list, ProposalCard, cancel-request link). Props: `{ requestId, budget }`.
- [x] 1.2 Move `SortSeg` and `ProposalCard` into the component. On accept: mutate + invalidate `keys.request(id)`, `keys.myRequests`, and `keys.events(id)` (no navigation — the screen morphs into the accepted state). On cancel: confirm + `cancelRequest` (no manual back).

## 2. Render inline on the open request screen
- [x] 2.1 In `request/[id]/index.tsx`, open branch: replace the "Ver propostas (N)" button with `<ProposalsList requestId={requestId} budget={request.budget_max} />` after `CustomerQna`.
- [x] 2.2 Remove the now-unused proposals navigation + `requestDetail.viewProposals` button usage (and any now-unused imports).

## 3. Redirect the dedicated route
- [x] 3.1 Replace `request/[id]/proposals.tsx` body with a redirect to `request/[id]`.

## 4. Verify
- [x] 4.1 Typecheck shared + customer app (0 new errors).
- [x] 4.2 Visual (Playwright @ :19083): open request #1 shows the proposal list inline (sort + cards + accept) with no "Ver propostas" button; `/request/1/proposals` redirects to `/request/1`; accepting a proposal morphs the same screen into the accepted state (map + start code + provider card) and the feed shows `proposal_accepted` + approved value — no navigation.
