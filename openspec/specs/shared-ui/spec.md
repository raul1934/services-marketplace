# shared-ui

## Requirements

### Requirement: Web layout is constrained to a phone column
The app SHALL render its screens within a centered column of at most 480px on
wide viewports, preserving the phone-first composition on tablet/desktop.

#### Scenario: Desktop viewport
- WHEN the app is viewed at ≥768px
- THEN screen content is centered and capped at ~480px (not stretched edge-to-edge)

### Requirement: Caption text meets AA contrast
Secondary/caption text SHALL use a color with ≥4.5:1 contrast on surface by default.

#### Scenario: Caption on white surface
- WHEN `Text variant="caption"` renders on `surface`
- THEN its color is `ink2` (~5.4:1), not `ink3` (~2.6:1)

### Requirement: Headings expose semantic roles
Heading text SHALL expose a heading role and level to assistive tech.

#### Scenario: Heading variant
- WHEN `Text variant="h1"|"h2"|"h3"` renders
- THEN it has `accessibilityRole="header"` and an `aria-level` of 1/2/3 on web

### Requirement: Interactive controls show focus and hover on web
Buttons, icon buttons, pressable cards, and chips SHALL show a visible focus
indicator when keyboard-focused and feedback on hover (pointer devices) on web.

#### Scenario: Keyboard focus
- WHEN a control receives keyboard focus on web
- THEN a visible accent outline is shown

#### Scenario: Pointer hover
- WHEN a pointer hovers a control on web
- THEN the control shows hover feedback

### Requirement: Icon-only buttons have accessible names
Icon-only buttons SHALL expose a button role and an accessible name.

#### Scenario: Icon button
- WHEN an icon-only button renders
- THEN it has `accessibilityRole="button"` and an `accessibilityLabel`

### Requirement: Reusable success splash animation
The shared UI SHALL provide a `SuccessSplash` component: a green circle that
reveals outward from the center until it fills the screen, followed by an animated
check mark (scale + fade in). After a short hold it SHALL invoke an `onDone`
callback. It SHALL be presentational only (no navigation), so callers decide what
happens next.

#### Scenario: Splash plays then signals done
- WHEN a screen renders `SuccessSplash`
- THEN a green circle expands from the center to fill the screen and a check mark animates in
- AND after the animation it calls `onDone`

### Requirement: Screen can pin a sticky header
The `Screen` component SHALL support a `stickyHeader` option that keeps the
screen's header fixed at the top while the body scrolls. When enabled, the
screen's first child is rendered pinned above the scroll area over an opaque
background, respecting the screen's padding and centered-column layout; the
remaining children scroll underneath. Single-child screens (e.g. a loading
spinner) are unaffected. Screens across the apps that show a title or top bar
(`AppBar` / `BackBar` / an `h1` title) SHALL use it so their header stays visible
on scroll.

#### Scenario: Header stays fixed while content scrolls
- WHEN a screen with `stickyHeader` is scrolled
- THEN the header (first child) stays pinned at the top and the rest of the content scrolls under it

#### Scenario: Header keeps its layout
- WHEN a screen pins its header
- THEN the header keeps the screen's horizontal padding / centered-column width and sits over an opaque background

### Requirement: In-app language selection that persists
Both apps SHALL let the user choose the UI language (Português / English) from the
profile screen. Selecting a language SHALL switch the UI immediately and persist
the choice (re-applied on next launch). When no language has been saved, the
device locale SHALL be used (current behavior). The shared UI SHALL provide the
language list and the load/persist helpers used by both apps.

#### Scenario: Switch language from profile
- WHEN the user selects "English" on the profile language selector
- THEN the UI copy switches to English and "English" is highlighted as active

#### Scenario: Language persists across restarts
- WHEN the user has chosen a language and reopens the app
- THEN the app starts in the chosen language rather than the device locale
