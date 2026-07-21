# Tasks — calm, grouped, correctly wired notifications

## 1. Stop the perpetual pulse (NOTIF-01)
- [ ] 1.1 Replace the infinite `Animated.loop` in `primitives.tsx:51-59` with a single pulse triggered by the unread count going up.
- [ ] 1.2 Verify the ring is still noticeable on arrival and still while idle.

## 2. Group the noise (NOTIF-02)
- [ ] 2.1 Decide the grouping key (proposal: `request_id` + type family) and record it in the proposal.
- [ ] 2.2 Backend: emit a group key on the notification payload.
- [ ] 2.3 Android: set `groupId` / summary notification so five bids collapse into one shade entry.
- [ ] 2.4 In-app list (`notifications.tsx`): collapse consecutive same-request entries with a count.
- [ ] 2.5 Check the badge on a seeded account with a busy request — it should read as a number a human can act on.

## 3. Realtime token refresh (NOTIF-03)
- [ ] 3.1 Make `echo.ts` resubscribe (or reconnect) when the auth token changes instead of reusing the captured one.
- [ ] 3.2 Reproduce first: force a token refresh and confirm events stop arriving on the current build, then confirm the fix restores them.

## 4. Chime rate limit (NOTIF-04)
- [ ] 4.1 Hoist `MIN_GAP_MS` bookkeeping into shared module state so every `useNotificationChime` instance shares it.
- [ ] 4.2 Mount two listeners and confirm a single chime.

## 5. Launcher badge (NOTIF-05)
- [ ] 5.1 Decide: enable `shouldSetBadge` or document why the count stays in-app.
- [ ] 5.2 If enabled, verify the badge clears when the list is read.

## 6. Close out
- [ ] 6.1 Update `ux-audit/findings.json`, run `python ux-audit/sync-status.py`, commit together.
