# shared-ui

## ADDED Requirements

### Requirement: Screen can pin a sticky header
The `Screen` component SHALL support a `stickyHeader` option that keeps the
screen's header fixed at the top while the body scrolls. When enabled, the
screen's first child is rendered pinned above the scroll area over an opaque
background, respecting the screen's padding and centered-column layout; the
remaining children scroll underneath. Screens across the apps that show a title
or top bar (`AppBar` / `BackBar` / an `h1` title) SHALL use it so their header
stays visible on scroll.

#### Scenario: Header stays fixed while content scrolls
- WHEN a screen with `stickyHeader` is scrolled
- THEN the header (first child) stays pinned at the top and the rest of the content scrolls under it

#### Scenario: Header keeps its layout
- WHEN a screen pins its header
- THEN the header keeps the screen's horizontal padding / centered-column width and sits over an opaque background
