# customer

## ADDED Requirements

### Requirement: Customer attaches photos during the create-request wizard
The create-request wizard SHALL upload each selected photo immediately and attach
the resulting media ids when the request is created, so photos can be picked and
previewed before the request exists.

#### Scenario: Photos picked mid-wizard are attached on submit
- WHEN the customer selects photos in the wizard
- THEN each is uploaded and a thumbnail preview is shown from its returned url
- WHEN the customer submits the request
- THEN the request is created with those media attached as `request`-tagged photos
