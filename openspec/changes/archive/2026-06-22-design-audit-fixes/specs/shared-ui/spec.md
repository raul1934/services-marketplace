# shared-ui (delta)

## ADDED Requirements

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
