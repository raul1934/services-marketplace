# Put "pedir ajuda" where the thumb already is

## Why

The app's reason to exist is asking for help, and asking for help is the hardest
thing to find in it. There is no persistent "Pedir" anywhere in the navigation:
the tab bar has three tabs (home, requests, profile) and no `+`, so the primary
action lives inside the home's scroll. Moving that card to the top helped, but it
is still a card in a page rather than an always-available action.

A first-time account has it worse. With no assets, the home opens a full-screen
tutorial whose call to action is `/assets/new` — the app's answer to "my car broke
down" is "first, register your car". And the card that *sounds* most urgent,
"Precisa de ajuda agora?", is the slowest route: it goes to `/categories`, an extra
hop, while the quick-help shortcuts above it go straight into the wizard.

The drawer compounds it: "meu perfil", "meus pedidos" and "meus ativos" duplicate
the tabs and the home, and the one thing that is *not* reachable elsewhere —
"pedir serviço" — is hidden behind the hamburger.

## What changes

- **NAV-01** — a persistent primary action: either a centre "Pedir" tab or a
  global FAB. Pick one and apply it to every tab screen.
- **ASSET-01** — invert the empty-state onboarding: the primary action is asking
  for help; registering an asset is secondary and deferrable.
- **HOME-02** — "Precisa de ajuda agora?" creates a request directly instead of
  routing through the category list.
- **NAV-02** — trim the drawer to what it uniquely offers; promote "pedir".
- **HOME-03** — search on the category list; the user who knows what they need
  should not scroll sections.
- **HOME-04** — the category list gets empty and error states instead of a blank
  screen when `useCategories` fails.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/(tabs)/_layout.tsx`, `app/(tabs)/home.tsx`,
  `app/categories.tsx`, `src/components/AppDrawer.tsx`, `HomeAssets.tsx`,
  `FirstAssetTutorial.tsx`.
- **Findings**: NAV-01, ASSET-01, HOME-02, NAV-02, HOME-03, HOME-04.
- **Depends on**: nothing, but it overlaps `express-request-flow` — where the
  primary action *lands* is defined there. Land this one first so the express
  flow has a real entry point to shorten.
- **Open decision**: centre tab vs FAB. The tab reads as navigation and is always
  visible; the FAB floats over content and can collide with the pinned footers
  several screens already use.
