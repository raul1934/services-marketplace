# shared-ui

## ADDED Requirements

### Requirement: Reusable success splash animation
The shared UI SHALL provide a `SuccessSplash` component: a full-screen green
overlay with an animated check mark (scale + fade in) that, after a short hold,
invokes an `onDone` callback. It SHALL be presentational only (no navigation),
so callers decide what happens next.

#### Scenario: Splash plays then signals done
- WHEN a screen renders `SuccessSplash`
- THEN it shows a green full-screen overlay with an animated check
- AND after the animation it calls `onDone`
