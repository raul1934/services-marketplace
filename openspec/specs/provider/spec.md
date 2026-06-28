# provider

## Requirements

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

### Requirement: Provider may verify the customer's start code when starting a job
A `start_code` SHALL exist only for **urgent** jobs. For an urgent job the provider
SHALL be required to enter the customer's `start_code` to move the job from
`accepted` to `in_progress`. The code SHALL be entered in a **modal with a 4-cell
code input** (not an inline field), opened from the start action; the job starts
only via `POST requests/{id}/start` with a code that verifies server-side, and a
wrong code SHALL show an error in the modal. The plain status update
(`accepted → in_progress`) SHALL be rejected for urgent jobs. For scheduled jobs
there is no code: the job starts via the existing slide / status update. The
`start_code` MUST NOT appear in the provider's request payload.

#### Scenario: Urgent start opens a 4-cell code modal
- WHEN the provider taps start on an urgent accepted job
- THEN a modal with four code cells opens, and entering the correct code starts the job via `POST requests/{id}/start`
- AND a plain `accepted → in_progress` status update is rejected (422)

#### Scenario: Wrong code shows an error in the modal
- WHEN the provider enters an incorrect code in the modal
- THEN the start is rejected and the modal shows an error; the job stays `accepted`

#### Scenario: Scheduled job starts without a code
- WHEN the provider starts a scheduled job
- THEN no code modal is shown and the job starts via the existing slide / status update

#### Scenario: Start code hidden from the provider payload
- WHEN the provider views the job detail
- THEN the `start_code` is not present in the provider's request payload

### Requirement: Provider bids from a dedicated screen
The provider bid wizard SHALL live on its own route (`job/[id]/bid`) rather than
inline in the job detail. The job detail for an open request SHALL show a summary
and a "Enviar proposta" action that navigates to the bid screen. A bid SHALL be
sendable only once: after a successful send the send control SHALL be disabled. On
success the screen SHALL show a full-screen success animation (green with an
animated check) and then land on the job screen showing the submitted proposal
("proposta enviada"), navigating with `replace` so the wizard cannot be returned
to.

#### Scenario: Open the bid screen
- WHEN the provider opens an open (unbid) request and taps "Enviar proposta"
- THEN the bid wizard screen opens

#### Scenario: Sending a bid shows success then the proposal
- WHEN the provider slides to send a completed bid
- THEN a full-screen green check animation plays
- AND the provider then lands on the job screen showing their submitted proposal

#### Scenario: A bid cannot be sent twice
- WHEN a bid has been sent successfully
- THEN the send control is disabled and the wizard is replaced, so the same bid cannot be submitted again

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

### Requirement: Nearby map markers show category and price
On the provider Nearby map, each request marker SHALL show the request's category
icon with its average price **below** it (the area average, falling back to the
budget cap). When the request is urgent, both the icon and the price SHALL be red;
otherwise they use the accent color. Tapping a marker SHALL select the request and
**pan the map to center it without changing the zoom**, with the detail sheet shown
above the map; closing the sheet SHALL pan back to the previous center. The markers
SHALL render on both native and web.

#### Scenario: Marker shows the icon with price below
- WHEN the provider opens the Nearby map
- THEN each marker shows the category icon with the average price below it

#### Scenario: Urgent markers are red
- WHEN a request is urgent
- THEN both the marker icon and its price are red; non-urgent markers use the accent color

#### Scenario: Selecting a marker centers it without zoom change
- WHEN the provider taps a marker
- THEN the map pans to center it at the same zoom and the detail sheet opens above the map
- AND closing the sheet pans back to the previous center

### Requirement: Nearby list shows already-bid requests
In the provider Nearby feed, a request the provider has already bid on SHALL be
marked as such (a "Proposta enviada" indicator) instead of offering the bid
action. The nearby feed SHALL carry the provider's own proposal so the UI can tell.

#### Scenario: Already-bid request is marked
- WHEN a nearby request already has the provider's bid
- THEN the list item shows "Proposta enviada" instead of the "Enviar proposta" button

### Requirement: Provider records the vehicle odometer during a service
While working a service request tied to a vehicle asset, the accepted provider
SHALL be able to record the vehicle's odometer from the job report. The reading
SHALL be appended to that asset's mileage history (tied to the service request,
tagged as provider-recorded) and update the asset's current mileage. A provider
who is not the accepted provider of the request SHALL NOT be able to record it.

#### Scenario: Provider records the odometer on the job
- WHEN the accepted provider submits an odometer reading on a request that has a vehicle asset
- THEN the reading is appended to the asset's mileage history (linked to the request) and the asset's current mileage is updated

#### Scenario: Only the accepted provider can record
- WHEN a provider who is not the accepted provider of the request tries to record the odometer
- THEN the request is rejected (403)

#### Scenario: Non-vehicle request rejected
- WHEN a provider tries to record an odometer on a request that has no vehicle asset
- THEN the request is rejected as invalid (422)

### Requirement: Provider image attachments are upload-first
Provider image attachments (job before/after photos, profile avatar) SHALL be
uploaded via `POST uploads` and attached by media id on the owning
create/update/action; there SHALL be no per-target provider image-upload
endpoints. (Provider documents are out of scope — they accept non-image files
such as PDFs and keep their own endpoint.)

#### Scenario: Before/after job photos
- WHEN the provider adds before/after photos in the job report
- THEN the photos are uploaded first and attached by `media_ids` with the `phase` (before/after)

#### Scenario: Avatar
- WHEN the provider sets a profile photo
- THEN it is uploaded first and the profile is updated with the returned `avatar_media_id`
