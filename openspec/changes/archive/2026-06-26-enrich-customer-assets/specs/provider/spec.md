# provider

## ADDED Requirements

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
