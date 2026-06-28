# provider

## ADDED Requirements

### Requirement: Account is reached from the avatar and drawer, not a tab
The provider's account/profile SHALL NOT be a bottom tab. The bottom bar SHALL be
Dashboard, Nearby, Work, Schedule. The account screen SHALL be reachable from (a)
a circular avatar button at the top-right of the dashboard and (b) the drawer's
account section. The profile route SHALL remain valid (hidden from the bar). Since
it is reached by navigation (not a tab), the account screen SHALL show a back
control that returns to the dashboard.

#### Scenario: Profile is not in the bottom bar
- WHEN the provider views the bottom tab bar
- THEN it shows Dashboard, Nearby, Work, Schedule (no Profile tab)

#### Scenario: Avatar opens the account
- WHEN the provider taps the circular avatar at the top-right of the dashboard
- THEN the account/profile screen opens

#### Scenario: Drawer opens the account
- WHEN the provider opens the drawer and taps the account item
- THEN the account/profile screen opens

#### Scenario: Account screen has a back control
- WHEN the provider is on the account screen
- THEN a back button is shown that returns to the dashboard
