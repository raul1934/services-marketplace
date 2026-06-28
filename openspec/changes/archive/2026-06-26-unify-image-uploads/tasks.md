# Tasks — unify image uploads

## 1. Single upload endpoint (`backend`)
- [x] 1.1 `UploadController@store`: accept `photos[]` (1–10) as canonical, keep `files[]`/`file`/`photo` aliases; validate `image|max:5120`; return `[{id,url}]`.

## 2. Migrate consumers to upload-first (`backend`)
- [x] 2.1 Asset: `store`/`update` accept `photo_media_id` (owned, `exists:media,id`) → `MediaService::consume` sets `photo_path`, deletes old file. Removed `AssetController@photo` + route.
- [x] 2.2 Request reference photos: `media_ids` on create (already). Removed `RequestController@photos` + route.
- [x] 2.3 Question answer: accepts `media_ids` → `attach(...,'answer')`. Removed `QuestionController@photos` + route.
- [x] 2.4 Job before/after: `JobController@jobMedia` takes `media_ids` + `phase` → `attach(...,phase)`. Removed `Provider\JobPhotoController` + `job-photos` route; added `job-media`.
- [x] 2.5 Avatar: `PUT provider/profile` accepts `avatar_media_id` (`consume` → `avatar_path`). Removed `ProviderController@avatar` + route.
- [~] 2.6 Document: **excluded** — `provider/documents` accepts PDFs (not images), has its own KYC table, so it's not an image-upload endpoint. Left unchanged. (Surfaced as the one scope refinement.)
- [x] 2.7 `php artisan test` green (44 pass; rewrote MediaFlow/PreBidSuggestion to upload-first; added `UploadFlowTest`). Only pre-existing `ExampleTest` fails.

## 3. Client helper (`frontend`)
- [x] 3.1 `uploadPhotos(picked[]) → {id,url}[]` (posts `photos[]` to `uploads`, via shared `http`) added to each app's `photos.ts`; `appendPhoto`/`pickPhotos` kept.
- [x] 3.2 Removed `photosForm`/`mediaForm`/`assetPhotoForm` (customer) and `jobPhotosForm` (provider).

## 4. Customer app
- [x] 4.1 asset `new`/`edit`: pick → `uploadPhotos` → `photo_media_id` on create/update.
- [x] 4.2 request wizard: upload-first → `media_ids` on create.
- [x] 4.3 question answer: upload → `media_ids` on answer.
- [x] 4.4 `api.ts`/`queries.ts`: dropped removed endpoints; payloads gained `photo_media_id`/`media_ids`.

## 5. Provider app
- [x] 5.1 worklog before/after: upload → `attachJobMedia({phase, media_ids})`.
- [x] 5.2 profile avatar → `avatar_media_id`. (Documents excluded — see 2.6.)
- [x] 5.3 `api.ts`/`queries.ts` updated; dropped removed endpoints.

## 6. Verification
- [x] 6.1 Backend: `php artisan test` 44 pass; `UploadFlowTest` covers `photos[]` upload, asset `photo_media_id`, job `phase` attach, non-owner ignored.
- [x] 6.2 `tsc --noEmit` (shared + both apps) clean (only known pre-existing errors).
- [x] 6.3 Playwright smoke: customer assets list, make picker, request 57 render; zero console errors. (File-pick upload covered by backend `UploadFlowTest`, not browser-automatable.)
- [x] 6.4 Delta requirements walked with evidence.
