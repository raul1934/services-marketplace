# provider

## ADDED Requirements

### Requirement: Nearby jobs is a bottom tab
The provider SHALL reach the "Nearby jobs" feed from the bottom tab bar, as the
second tab (order: Dashboard, Nearby, Work, Schedule, Profile). The dashboard
SHALL NOT show a floating button for it. As a tab, the Nearby screen SHALL show a
tab title (no back arrow) while keeping its filter control.

#### Scenario: Nearby is the second tab
- WHEN the provider views the bottom tab bar
- THEN the second tab is "Nearby" (search icon) and opens the nearby-jobs feed

#### Scenario: No floating button on the dashboard
- WHEN the provider is on the dashboard
- THEN there is no floating button to open Nearby (it's a tab)
