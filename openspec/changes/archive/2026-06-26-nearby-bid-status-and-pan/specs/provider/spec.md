# provider

## ADDED Requirements

### Requirement: Nearby list shows already-bid requests
In the provider Nearby feed, a request the provider has already bid on SHALL be
marked as such (a "Proposta enviada" indicator) instead of offering the bid
action. The nearby feed SHALL carry the provider's own proposal so the UI can tell.

#### Scenario: Already-bid request is marked
- WHEN a nearby request already has the provider's bid
- THEN the list item shows "Proposta enviada" instead of the "Enviar proposta" button

## MODIFIED Requirements

### Requirement: Nearby map markers show category and price
On the provider Nearby map, each request marker SHALL show the request's category
icon with its average price below it (the area average, falling back to the budget
cap). When the request is urgent, both the icon and the price SHALL be red;
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
