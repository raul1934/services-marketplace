# Tasks — survive a bad connection

## 1. Connectivity (GLOB-01)
- [ ] 1.1 Add `@react-native-community/netinfo`; rebuild the dev client (native).
- [ ] 1.2 `useConnectivity()` in `packages/shared`.
- [ ] 1.3 `<OfflineBanner>` mounted at the app root, respecting safe-area insets.
- [ ] 1.4 Wire React Query `onlineManager` so queries pause offline and revalidate on reconnect.
- [ ] 1.5 Device test in airplane mode: banner appears, list stops erroring, reconnect refetches.

## 2. Error surfaces (GLOB-02)
- [ ] 2.1 `PaginatedList`: expose `isError` + `refetch`; render `<ErrorState>` instead of the empty state.
- [ ] 2.2 Add `<ErrorState>` (message + retry) to the shared UI.
- [ ] 2.3 Add `<Toast>`; replace `Alert.alert` in `client.ts` and the screens that use it for errors.
- [ ] 2.4 Add a global `ErrorBoundary` with a recoverable fallback.
- [ ] 2.5 Force a 500 on a list endpoint and confirm the user sees an error with a working retry, not an empty list.

## 3. Session (AUTH-06)
- [ ] 3.1 Stop logging out on the first 401: retry once, and only then sign out.
- [ ] 3.2 Tell the user why the session ended instead of a silent bounce to welcome.
- [ ] 3.3 Decide whether a refresh token is in scope; if not, record why in the proposal.

## 4. Progress convention (GLOB-04)
- [ ] 4.1 Write the rule down (skeleton = first load, spinner = discrete action).
- [ ] 4.2 Apply it to the screens that currently disagree.

## 5. Close out
- [ ] 5.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
