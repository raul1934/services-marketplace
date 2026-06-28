# provider (delta)

## ADDED Requirements

### Requirement: Provider can opt into liability insurance from profile
The provider SHALL be able to toggle active liability coverage ("com seguro")
from the edit-profile screen; enabling it surfaces the "com seguro" badge to
clients on the provider's proposals.

#### Scenario: Enable coverage
- WHEN the provider toggles insurance on in edit-profile
- THEN `updateProfile({ insured: true })` is sent and the profile reflects coverage
- AND the provider's proposals show the "com seguro" badge to clients

#### Scenario: Disable coverage
- WHEN the provider toggles insurance off
- THEN `updateProfile({ insured: false })` is sent and the badge no longer shows
