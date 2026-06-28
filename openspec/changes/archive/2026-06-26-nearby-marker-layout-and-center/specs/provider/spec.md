# provider

## MODIFIED Requirements

### Requirement: Nearby map markers show category and price
On the provider Nearby map, each request marker SHALL show the request's category
icon with its average price **below** it (the area average, falling back to the
budget cap). When the request is urgent, both the icon and the price SHALL be red;
otherwise they use the accent color. Tapping a marker SHALL select the request and
**center the map on that marker**, with the detail sheet shown above the map;
closing the sheet SHALL return the map to its previous view (position and zoom).
The markers SHALL render on both native and web.

#### Scenario: Marker shows the icon with price below
- WHEN the provider opens the Nearby map
- THEN each marker shows the category icon with the average price below it

#### Scenario: Urgent markers are red
- WHEN a request is urgent
- THEN both the marker icon and its price are red; non-urgent markers use the accent color

#### Scenario: Selecting a marker centers it; closing restores the view
- WHEN the provider taps a marker
- THEN the map centers on that marker and the detail sheet opens above the map
- AND closing the sheet returns the map to the previous position and zoom
