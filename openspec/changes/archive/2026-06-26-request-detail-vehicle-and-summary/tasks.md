# Tasks — asset on request + completed summary

## 1. Backend
- [x] 1.1 `Customer\RequestController@show`: eager-load `asset.detailable` (+ vehicle make) via morphWith so the request's `asset` serializes with resolved make/model + `make_logo_url`.
- [x] 1.2 Verify `php artisan test` green.

## 2. Customer app — asset card
- [x] 2.1 Reusable asset summary row (nickname + type + brand logo for vehicles + make·model·plate caption), tappable → `/assets/{id}`.
- [x] 2.2 Render it on the request screen near the top when `request.asset` is present.

## 3. Customer app — completed summary
- [x] 3.1 When `status === completed`, show a consolidated section: ReceiptView (settlement), parts list, timeline (accepted/started/completed), provider, and the review entry — reusing existing components/data.

## 4. Verification
- [x] 4.1 `tsc --noEmit` (apps/customer) clean (only known pre-existing errors).
- [x] 4.2 Playwright: open a completed request tied to a vehicle → the asset card with brand logo shows and the completed summary renders; tapping the asset opens its detail; zero console errors.
- [x] 4.3 Walk the delta requirements with evidence.
