# Design — bid-send-success-splash

## SuccessSplash (shared-ui)
New `packages/shared/src/ui/SuccessSplash.tsx`, exported from the ui barrel:

```tsx
export function SuccessSplash({ onDone, holdMs = 1100 }: { onDone?: () => void; holdMs?: number }) {
  // Animated.spring scale (0→1) + fade-in on a check icon, over a full-screen
  // green (t.colors.ok) overlay (StyleSheet.absoluteFill, high zIndex).
  // After the entrance + holdMs, calls onDone().
}
```

- Background `t.colors.ok` (the app green), an `Icon name="check"` (white) inside a
  translucent white circle, scaled in with `Animated.spring` + opacity.
- Uses `useNativeDriver: true`. After the entrance animation and a short hold,
  invokes `onDone` (so the caller can navigate). Pure presentational; no nav of
  its own.

## Provider bid send (`app/job/[id]/bid.tsx`)
- Add `const [sent, setSent] = useState(false)`.
- `send()` onSuccess: `setSent(true)` — **no alert, no immediate navigation**.
- onError: keep the existing alert.
- Slide footer: `disabled: submit.isPending || sent` (can't re-send after success).
- Wrap the screen so the overlay can cover it:
  ```tsx
  return (
    <View style={{ flex: 1 }}>
      <Wiz …>…</Wiz>
      {sent && <SuccessSplash onDone={() => router.replace(`/job/${requestId}`)} />}
    </View>
  );
  ```
- Landing on `/job/[id]` shows the provider's "proposta enviada" state (the job
  screen already renders the bidded state for an open request). `replace` prevents
  going back into the wizard to send again.

## Why a flag + replace (not just disable-while-pending)
`submit.isPending` is false again the moment the request resolves, leaving a brief
window (and the post-success render) where the slide is live. A sticky `sent` flag
plus navigating away with `replace` closes both the double-send window and the
back-into-wizard path.
