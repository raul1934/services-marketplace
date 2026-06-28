# Show the asset on the request, and a richer summary when completed

## Why

The customer request screen (`/request/[id]`) never shows the **asset** the
request is tied to — so at `/request/57` there's no vehicle/brand shown at all
(this is what "não aparece a logo" was about). And once a job is **completed**,
the screen is thin: it doesn't consolidate what was done, the parts, the
settlement, or who did it.

## What changes

**1. Asset card on the request.** Show the linked asset (nickname + type, the
brand logo for vehicles, and the make·model·plate caption) near the top of the
request screen, tappable to open the asset's detail. The request payload already
carries `asset` (with `detail` + `make_logo_url`); the customer `RequestController`
just needs to load `asset.detailable` (+ make) so the logo/caption resolve.

**2. Richer "completed" summary.** When the request is `completed`, surface a
consolidated summary: the receipt/settlement breakdown (labor + parts + surcharge,
already computed), the parts list, key timestamps (accepted / started / completed),
the provider, and the existing review entry — reusing the current `ReceiptView`
and job-report data rather than new backend work.

## Impact

- **Affected specs**: `customer`
- **Affected code**:
  - Backend — `Customer\RequestController@show` eager-loads `asset.detailable`
    (+ vehicle make) so the asset serializes with its resolved detail/logo. (No
    new endpoints; settlement/parts already exposed.)
  - Customer app — request screen: an `AssetCard` (reusing the brand-logo +
    caption pattern) and a completed-state summary section (ReceiptView + parts +
    timeline + provider); `queries.ts` unaffected.
- **Out of scope**: provider-side request screen changes; editing the asset from
  the request; any new settlement math (reuse what exists).
