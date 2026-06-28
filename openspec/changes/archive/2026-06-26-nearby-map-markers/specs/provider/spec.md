# provider

## ADDED Requirements

### Requirement: Nearby map markers show category and price
On the provider Nearby map, each request marker SHALL show the request's category
icon and its average price (the area average, falling back to the budget cap),
instead of a plain dot. Urgent requests SHALL be colored red; others use the
accent color. Tapping a marker SHALL select the request. The markers SHALL render
on both native and web.

#### Scenario: Marker shows category and price
- WHEN the provider opens the Nearby map
- THEN each request marker shows the category icon and the average price

#### Scenario: Urgent markers are red
- WHEN a request is urgent
- THEN its marker is red; non-urgent markers use the accent color

#### Scenario: Tapping a marker selects the request
- WHEN the provider taps a marker
- THEN that request is selected (as before)

#### Scenario: The tapped-pin sheet shows above the map
- WHEN the provider taps a marker and the detail sheet opens
- THEN the sheet is shown above the map (not behind it)
