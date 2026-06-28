# Design — sticky-screen-header

## Screen component (`packages/shared/src/ui/Screen.tsx`)
Add `stickyHeader?: boolean`. When true, split the children: the first becomes a
pinned header, the rest become the scroll/body content.

```tsx
const kids = React.Children.toArray(children);
const header = stickyHeader ? kids[0] : null;
const body = stickyHeader ? kids.slice(1) : children;
```

Render order inside `SafeAreaView`:
1. `header` (when present) in a pinned View — opaque background so scrolled
   content doesn't show through, and the same column cap + padding as the body:
   ```tsx
   <View style={[{ backgroundColor: t.colors.bg }, column, pad]}>{header}</View>
   ```
   `pad` is the existing `padded ? { paddingHorizontal: 20 } : {}`. `AppBar` /
   `BackBar` bring their own horizontal padding and are used with `padded={false}`,
   so they don't get double padding; `h1` title screens use `padded` (default) so
   the title keeps its 20px inset.
2. The existing `ScrollView` (or `View` when `scroll={false}`) with `body`.
3. The existing `footer` block.

No change to screens that don't set `stickyHeader`.

## Why pin the first child (not a new `header` prop)
The header is already the first child of `<Screen>` on essentially every screen
(`{backBar}` / `<AppBar/>` / the `<h1>` block). Pinning the first child means each
screen only adds the `stickyHeader` prop — no JSX moves — which keeps a 33-screen
rollout mechanical and low-risk. A dedicated `header` prop would force restructuring
every screen.

## Rollout
Add `stickyHeader` to the `<Screen>` of each screen whose first child is its
header: the 26 `BackBar` screens, the 2 `AppBar` dashboards, and the 5 `h1` tab
screens (requests, profile ×2, jobs, agenda). Loading/empty-only screens are
skipped.

## Alternative considered
`ScrollView stickyHeaderIndices={[0]}` — keeps the header in-flow and sticks it.
Rejected: it needs the header element itself to be opaque (the `h1` block and the
transparent bars aren't), and it only works for `scroll`-mode screens; the pinned
first-child approach handles both scroll and non-scroll screens uniformly.
