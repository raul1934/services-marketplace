# Tasks — add-polymorphic-media

## 1. Schema & model
- [x] 1.1 Migration: create `media` table (nullable polymorphic cols, tag, position, indexes).
- [x] 1.2 `Media` model (morphTo `mediable`, `uploadedBy`, `url` accessor, `$appends`).
- [x] 1.3 `HasMedia` trait (`media()` morphMany, `mediaByTag()`); apply to ServiceRequest, Surcharge, DisputeEvidence, JobUpdate.

## 2. Backfill & drop old storage (same migration or a paired one)
- [x] 2.1 Backfill request_photos → media (tag = phase), preserving created_at/uploaded_by.
- [x] 2.2 Backfill surcharges.photos, dispute_evidence.photos (JSON arrays) → media.
- [x] 2.3 Backfill job_updates.photo_path → media (tag `update`).
- [x] 2.4 Drop request_photos table + surcharges.photos / dispute_evidence.photos / job_updates.photo_path columns; reversible-in-dev `down()`.

## 3. Upload + attach
- [x] 3.1 `POST /uploads` (`UploadController@store`) for customer + provider: validate image(s), store, create orphan media, return `[{id,url}]`.
- [x] 3.2 `MediaService::attach($ids, $owner, $tag, $uploaderId)` — re-parent only orphan media owned by the uploader.
- [x] 3.3 Wire `media_ids[]` into create-request, job-photos, surcharge, dispute services (+ keep direct-multipart back-compat by upload-then-attach).

## 4. Cleanup
- [x] 4.1 `media:prune-orphans` command (delete orphan media + file older than 24h); schedule hourly.

## 5. Resources
- [x] 5.1 `MediaResource` (`id`, `url`, `tag`).
- [x] 5.2 ServiceRequestResource photos/before_photos/after_photos derive from media by tag (same `{id,url}` shape).
- [x] 5.3 Surcharge/Dispute resources expose media urls.

## 6. Seeder
- [x] 6.1 Update `DevJobSeeder` to seed `media` rows (replace `RequestPhoto` writes); keep the pure-PHP PNG generator.

## 7. Frontend
- [x] 7.1 shared `uploadMedia()` api + `useUploadMedia` hook (web-aware multipart).
- [x] 7.2 `request/new` wizard: upload-first (preview thumbnails, send `media_ids`).
- [x] 7.3 Add `Media` type; keep request photo fields `{id,url}`.

## 8. Verify
- [x] 8.1 Backend feature tests (upload→orphan, attach→reparent+tag, no cross-user hijack, prune, request resource shape).
- [x] 8.2 Migration/backfill count check on seeded data.
- [x] 8.3 `migrate:fresh --seed` green; typecheck shared + both apps (0 new errors).
