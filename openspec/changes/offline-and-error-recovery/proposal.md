# Survive a bad connection

## Why

This is an app used at the roadside, and it has **no concept of being offline**.
`NetInfo` is not imported anywhere: no banner, no queue, no revalidation on
reconnect. A request submitted in a dead spot fails as an error the user cannot
tell apart from "the server said no".

Errors are barely better when the connection is fine. `PaginatedList` does not even
expose `isError` — a failed query renders as an empty list, which reads as "you
have no requests" rather than "we could not load them". The errors that do surface
go through `Alert.alert`, which on web is `window.alert`, and there is no
`ErrorBoundary`, so a render error takes the whole app to a white screen.

One more sits next to this: any transient 401 triggers a global logout straight to
welcome, with no refresh attempt and no explanation. A flaky network can therefore
sign the user out mid-request.

## What changes

- **GLOB-01** — a `useConnectivity()` hook and an `<OfflineBanner>`; wire React
  Query's `onlineManager` so queries pause offline and revalidate on reconnect.
- **GLOB-02** — `PaginatedList` exposes `isError`/`refetch`; add a shared
  `<ErrorState>` with retry, a `<Toast>` to replace `Alert.alert`, and a global
  `ErrorBoundary`.
- **AUTH-06** — soft-retry a 401 (refresh token if we add one, otherwise one
  retry) and tell the user before dropping the session.
- **GLOB-04** — one rule for progress: skeleton for a first load, spinner for a
  discrete action. Today it is per-screen taste.

## Impact

- **Affected specs**: `shared-ui`, `customer`
- **Affected code**: `packages/shared/src/ui/PaginatedList.tsx`, `Screen`, new
  `ErrorState`/`Toast`/`OfflineBanner`, `packages/shared/src/api/client.ts:152-165`,
  `AuthProvider.tsx:50-54`, and the app root.
- **Findings**: GLOB-01, GLOB-02, GLOB-04, AUTH-06.
- **Adds a dependency**: `@react-native-community/netinfo` — needs a native rebuild
  of the dev client, so schedule it with other native work.
- **Out of scope**: an offline write queue. Detecting and communicating offline
  comes first; queuing a submitted request is a separate, larger change with its
  own conflict rules.
