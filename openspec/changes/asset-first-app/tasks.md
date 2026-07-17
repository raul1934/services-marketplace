# Tasks — turn the app asset-first

Status key: `[x]` done **and seen working on the device**, `[~]` written and
type-checks but **not verified**, `[!]` attempted and **failed**, `[ ]` not started.

Device: Galaxy M23, USB only (`adb -s RXCT5058WLY`; WiFi adb drops).
Metro: `npx expo start --dev-client --port 8081` + `adb reverse tcp:8081`.

> **Metro cache bites hard in this monorepo.** It cost four false investigations
> in one session: a new module invisible, a removed module still referenced, an
> `insets` "that doesn't exist" whose stack pointed at a line *before* the edit,
> and the same for `Modal`. **If anything behaves like stale code, restart with
> `--clear` before investigating anything else.**

## 1. Safe areas — content under the nav bar
- [x] 1.1 Tab bar: `height: 84` hardcoded overrode the bottom-tabs safe-area calc → `TAB_BAR_H + insets.bottom` + `paddingBottom` (both apps).
- [x] 1.2 `Screen` + `PaginatedList`: default `edges` `['top']` → `['top','bottom']`. No app screen passed `edges`, so *nothing* had a bottom inset.
- [x] 1.3 `AppDrawer`: raw Modal, `paddingBottom: 20` hardcoded → `+ insets.bottom` ("Sair" was cut in half).
- [x] 1.4 `Wiz`: `edges={['top']}` with a **sticky footer** — the 7-step request wizard's primary button sat under the nav buttons.
- [x] 1.5 `welcome`: builds its own chrome, `paddingBottom: 34` hardcoded.
- [x] 1.6 Verified no double padding on tab screens (SafeAreaView only pads where the view meets the screen edge).

## 2. Home — assets first
- [x] 2.1 `src/components/HomeAssets.tsx`: horizontal rail, "Adicionar" tile, "Ver todos".
- [x] 2.2 Remove the "Medir com RA · POC" card from the home and the drawer.
- [x] 2.3 Tile caption prefers the property's **address** over `kind · unit` (the nickname already says the type). *Correct by inspection only — prod assets have no address, so the difference is invisible with real data.*
- [ ] 2.4 `app/medicao.tsx` is now orphaned but **kept on purpose**: it is 69 KB of self-contained WebView prototype including the **360° room viewer**, which native AR does not replace. Retiring it is a product call.
- [x] 2.5 **"Ajuda rápida" is now asset-first** — a fixed curated shortlist (`QUICK_HELP_SLUGS` in `home.tsx`): Guincho, Bateria (vehicle) + Encanador, Limpeza (home), instead of the catalog's first 4 (all vehicle, since roadside seeds first). **Product decision: fixed actions**, two vehicle + two home so it isn't 100% car on a property-led app. The single-asset pre-select the user asked for needs no new code — each category carries `asset_type`, and `request/new` already auto-picks the lone asset of that type (7.1); the fixed tiles just feed that path. **Seen on device**: tiles render Guincho/Bateria/Encanador/Limpeza. (Auto-pick itself not demoable on the test account — it has 2 properties + 0 vehicles, so no exactly-one-of-a-type case; the 7.1 path is unchanged and already covered.)

## 3. Alerts (the bell)
- [x] 3.1 `Api/NotificationController.php`: `index` (paginated), `unreadCount`, `markRead`, `markAllRead`.
- [x] 3.2 `NotificationResource`: `type` comes from **`data['type']`** (the app-facing kind), *not* the `type` column, which is the PHP class name.
- [x] 3.3 Routes on **both** `customer_api.php` and `provider_api.php`, `auth:sanctum` without `abilities` — a user's notifications are their own whichever app asks.
- [x] 3.4 `NotificationListTest.php` — 7 tests (scoping, cross-user 404, both apps, the `type` mapping).
- [x] 3.5 `app/notifications.tsx` + `src/notificationLinks.ts` (icon + route per kind, **additive**: an unknown kind lists fine and just doesn't navigate).
- [x] 3.6 `badge` prop on the shared `IconButton`; wired to `useUnreadCount`.
- [x] 3.7 Verified end-to-end: badge 3 → 2 on read, backend confirms.
- [x] 3.9 Chased a badge reading **1** where 2 was expected. **Not a bug** — the database agreed (1 unread of 3); a stray test tap had opened a second notification. Checked before "fixing"; the count is trustworthy. Note the DB stamps `read_at` in **UTC** (local is UTC-3), which is what made it look wrong.
- [x] 3.8 **Solved at the type level, and the premise was wrong.** `frontend/icons/*.svg` is *not* the source of truth (leftover from the initial commit; only `google.svg` is imported) — icons resolve through the lucide `ICONS` map in `packages/shared/src/ui/Icon.tsx`. All 43 referenced names already resolved; nothing was broken. The real bug: `ICONS` was typed `Record<string, LucideIcon>`, so `IconName` collapsed to `string` and the `?? Search` fallback rendered a wrong icon *silently* — which is exactly why `file`/`money`/`refresh`/`alert` failed at **runtime, not typecheck**. Fixed with `satisfies` + `name: IconName` on the prop (30 mechanical sites, zero runtime change) + an `isIconName()` guard at the two untrusted boundaries (backend category, server notification kind). **Proved independently:** injecting `'money'` now errors `TS2322` at compile time; probe reverted.

## 4. Onboarding
- [x] 4.1 `FirstAssetTutorial.tsx`: full-screen, opens by default when `useAssets()` is empty, 3 steps, skippable.
- [x] 4.2 Copy speaks of **assets** (house, car, pet), not just property — `AssetType` is `vehicle | property | pet`.
- [x] 4.3 Uses `Modal`, not an absolute overlay: it renders from inside the home's ScrollView, where `position: absolute` is clipped to the content box.
- [x] 4.4 Remembers being skipped (`chamafacil.firstAsset.seen`); the home card stays as the quiet invitation. Without this it nags on every visit.
- [~] 4.5 **Guided flow now exists.** New `app/assets/[id]/setup.tsx`: after the *first* property is created it offers the rooms for that type (chips, pre-ticked) and its primary action adds them in one batch and hands off to AR for the first — the "address → offer the parts → measure the first" ask, end to end (address is already collected in `new.tsx`'s creation step). Threaded via a `guided=1` param: `FirstAssetTutorial` → `/assets/new?guided=1` → on a *property* create, `new.tsx` routes to the setup instead of the plain detail. Scoped to onboarding: later properties still land on the detail (whose AssetParts carries the same chips), so it never nags. Reuses `usePropertyTypes` + `useAddParts`; adds nothing that fabricates a measurement ("Depois" is always one tap away). Typechecks; **not seen on device** (part of the pending device session).

- [x] 4.6 **Asset registration is now a stepper**, not a long scroll form — same `Wiz` chrome as the request wizard, so creating an asset matches the guided flow it feeds. Steps adapt: type → details → (property only: location) → identity (photo + name); a picker entry (`?pick=1&type=`) drops the type step. Submit behaviour unchanged (picker hand-back / `guided` → room setup / else → detail). **Seen on device**: ETAPA 1/3 for a vehicle, 1/4 for a property (the location step appears), details step renders the type picker + fields, back + progress work.

## 5. Theme
- [x] 5.1 `lib/theme-pref.ts` (`ui_theme`), mirroring `lib/language.ts`.
- [x] 5.2 `ThemeProvider` works in **modes** (`auto`/`light`/`dark`), hydrated on boot. Which brand palette an app wears is not a user choice — offering it let a client pick `trust`, the **provider's** palette.
- [x] 5.3 Both profile pickers: Automático / Claro / Escuro.
- [x] 5.4 Verified: picked Escuro → killed the app → it reopened dark. Previously the override was plain `useState` and died on close.
- [ ] 5.6 Verify the **provider** app's picker (only the client's was seen).
- [ ] 5.5 Audit hardcoded `#ff6a3d` in `SplashBrand.tsx` / `UpdateBanner.tsx`. **Do not** theme the AR module (`ar/styles.ts`, `ar/materials.ts`) — it is a camera overlay, deliberately black/white.

## 6. Asset part catalog
- [x] 6.1 `part_types` (`id`, `name`, `slug`, `position`).
- [x] 6.2 Pivot `part_type_property_type` with **`default_selected`** — many-to-many, because "Sala" serves casa *and* apartamento.
- [x] 6.3 `PropertyTypeSeeder`: add **Edícula**.
- [x] 6.4 `PartTypeSeeder`, idempotent. **Edícula → piscina pre-checked**; Casa → piscina offered, unchecked.
- [x] 6.5 Endpoint: parts nested in `GET property-types` (same shape as vehicle makes → models); whole catalog in one request, `staleTime: DAY`.
- [x] 6.6 `AssetParts.tsx`: suggestion chips, defaults ticked, with the "desmarque o que não tiver" note. Free-text field kept — **seen on device**: Casa offers piscina unticked, Edícula ticked, and "Adega" added by hand alongside the chips.
- [x] 6.7 **Decision: batch.** `POST assets/{id}/parts` now takes `name` **or** `names[]` (one transaction). N parallel POSTs have N ways to half-succeed on a phone network, and `asset_parts.name` has no unique constraint, so a retry would duplicate whatever landed. The single-`name` shape is untouched. Covered by `AssetPartsTest::test_add_many_parts_at_once…` + `…_a_rejected_batch_creates_nothing`.
- [x] 6.8 Pre-checking a part is honest: a part is an **empty slot to measure** (`area: null` → "Sem medição"). Verified in the DB after committing chips: every row `area=NULL, measured_at=NULL`. Nothing seeds a *fact*.
- [~] 6.9 **Closed by 4.5's `setup.tsx`.** The chips now also reach a *brand-new* property through the guided onboarding path, not only an existing property's detail screen. Same catalog, same batch `useAddParts`; the setup just sequences them for a first-run user and continues into AR. Typechecks; not seen on device.

## 7. Sensible defaults
- [~] 7.1 Request wizard: with exactly one asset of the type, pre-select it + note under the list. Never overrides an existing pick (including the `?pick=1` round-trip).
- [ ] 7.2 Verify on device (needs an account with exactly one vehicle).
- [ ] 7.3 Find the other cases the user mentioned. Likely: address/coords from `getCurrentCoords`/`reverseGeocode` (`src/location.ts`, already used by the request wizard), and values carried from the user's **other assets** (same condo, same street) — real data, not guesses. **Ask before inventing the list.**

## 8. Brand inside the app
- [x] 8.1 `welcome` (both apps): plain `<Text>Chama Fácil</Text>` → `BrandMark` (logo + wordmark). It already existed; login already used it.
- [x] 8.2 Decorative blobs were drawn **after** the header, on top of it, with no `pointerEvents="none"` — they swallowed taps on the `EnvSwitch`. Reordered + marked untouchable.
- [~] 8.3 Verify the DEV/PROD toggle now responds on the welcome screen.
- [~] 8.4 **Brand now lives in the logged-in app** — a muted `BrandMark` signature at the foot of the shared `AppDrawer`, below "Sair" (`opacity: 0.5`, `height: 18`, `ink3`). Chosen over touching the header, which is correctly the *user's* identity (avatar/name); the footer is the *app's*. Shared component, so **both apps** get it in one edit. Typechecks; **not seen on device.** Placement is a design call and trivially adjustable if you'd rather have it elsewhere (home header, etc.).
- [x] 8.5 **Fixed for real, not silenced.** Root cause: `svg.d.ts` lived in `packages/shared` and only its own `include` saw it — an ambient `.d.ts` isn't pulled transitively like an imported `.tsx`, so no app that typechecks ever loaded it. The trap avoided: a blanket `declare module '*.svg'` would kill the errors while matching *any* `.svg`, existent or not — a renamed asset would still pass silently (same bug class). Instead: per-file sibling declarations via `allowArbitraryExtensions` (`frontend/assets/chamafacil-logo.d.svg.ts`, `frontend/icons/google.d.svg.ts`), resolved through the import graph so they can't drift out of an `include`. Typed `React.FC<SvgProps>` (the old `& { color }` was *narrowing* `SvgProps.color`, not extending). **Proved:** pointing an import at a missing `.svg` still errors `TS2307`; probe reverted. Both apps clean of the 4 errors.

## 9. Launcher icon & splash
- [ ] 9.1 The installed APK is **Walvee, 2026-07-11** — four days before the rebrand. That's why no icon shows. The artwork is fine. **Needs a device rebuild** (pairs with 9.4).
- [x] 9.2 **Both adaptive icons regenerated and measured at 64% coverage** (independently, via non-transparent bbox on the 1024² canvas — target 60–70, safe zone = central 66%). Provider was the ~6% "reads as no icon" case; now 64% like the client. Config/artwork only — the pixels won't show until a native rebuild (9.1/9.4).
- [x] 9.3 **Migrated, not just installed.** `expo-splash-screen` added to both `package.json` (`~57.0.4`, matches Expo SDK 57) and lockfile; the legacy top-level `splash` key moved into the plugin block in both `app.json` (`imageWidth: 288`, brand bg preserved: client `#ffffff`, provider `#4f46e5`). A `prebuild --clean` can no longer drop it silently.
- [ ] 9.4 Provider's `android/` predates the rebrand by 4 days → stale Walvee mipmaps. Only `expo prebuild --clean` regenerates. **Device task.**
- [ ] 9.5 **Still open — genuinely blocked, not skipped.** `landing/version.json` advertises `chamafacil-cliente.apk`/`chamafacil-prestador.apk` under `chamafacil.app/downloads/`, but `landing/downloads/` holds only a `README.txt`; the links 404. Fixing it *honestly* needs real APKs, which need the device build (9.1/9.4). Left untouched rather than fabricate a link or a version number. (The 9.x agent died on a 529 before reaching it — nothing partial landed in `landing/`.)

## 10. Push & realtime
- [ ] 10.1 Backend is **already built**: `PushTokenController`, `UserDevice`, `user_devices`, and `POST/DELETE push/token` routes exist. `ExpoChannel` talks to `exp.host` and needs **no server credentials**, only the token.
- [ ] 10.2 App side missing entirely: install `expo-notifications`, register the `ExponentPushToken` on login, drop it on logout, handle the tap → same deep-link map. **Needs a native rebuild** — pair with task 9.
- [~] 10.3 **Root cause found — it was Pusher, not Echo — and fixed.** The old note blamed `new Echo` under Hermes, but the throw came from *inside* it. Proof by module shape: `pusher-js@8.5.0`'s **web** bundle is `module.exports = Pusher` (the constructor), while the **react-native/node** bundles are `module.exports.Pusher = …` — a plain `{ Pusher }` object with **no `.default`** (despite the d.ts's `export default class Pusher`). The old `pusherModule.default ?? pusherModule` therefore handed Echo the *object* `{ Pusher }` on device; Echo's connector then ran `new options.Pusher(...)` = `new {}` → *"Object cannot be used as a constructor"*, thrown synchronously so the stack fingered `new Echo`. `laravel-echo@1.19.0` was always fine (`exports.default = Echo`, a normal constructable Babel class). Fix: unwrap Pusher the same way as Echo — first candidate of `[.default, .Pusher, module]` that is callable. **Verified against the real bundled module shapes in Node:** RN build now yields `PusherWithEncryption`, web yields `Pusher`, and `new Echo({Pusher})` builds a `PusherConnector` with no throw. **Not yet exercised on the device's Hermes runtime / against a live Reverb** — module shape is identical to what Metro bundles, but a live subscribe is 10.4's job (Reverb is off: `BROADCAST_CONNECTION=log`).
- [~] 10.4 **Mostly already true; the note was reading `.env.example`, not the running backend.** `/broadcasting/auth` **exists** and is **Sanctum-guarded** (`bootstrap/app.php` → `withBroadcasting(channels.php, ['middleware' => ['auth:sanctum']])`; confirmed via `route:list`), `channels.php` authorizes both private channels (user-notification + per-request owner/provider/bidder), and the **running** backend already has `BROADCAST_CONNECTION=reverb` with the `guincho-reverb` container up. Fixed the actual staleness: `.env.example` said `log` and lacked the `REVERB_*` keys — now `reverb` + documented placeholders. New `BroadcastAuthTest` proves the Sanctum gate (401 without a token; a real Bearer clears it). **Honest gap:** the owner/stranger 200-vs-403 matrix is *not* asserted in-test — phpunit pins the `null` driver (skips channel auth) and a Pusher-protocol driver in-harness returns null on user-resolution, 403-ing even the owner; that's a broadcasting-auth harness artifact, not a channels.php defect. Belongs to a live-Reverb / on-device check. Realtime end-to-end still unproven until the app registers (10.2) against live Reverb, but the client bug that blocked it is gone (10.3).

## 11. Asset detail tabs
- [~] 11.1 **Two tabs, reusing the shared `Segment`.** Tab 1 is labelled by the asset's *own* type (Veículo / Imóvel / Pet, reusing `assets.type.*`) — "Imóvel" would be a lie on a car. Tab 1 = identity + characteristics + (property: map/address + rooms; vehicle: current km + "Registrar km"). Tab 2 = **Histórico**. Judgement call: the odometer *log* moved to the timeline; the current-km *value + record button* stayed on tab 1 (read vs act). `assets.kmHistory`/`kmNone` now unused, left in locales. **Typechecks; not seen on device.**
- [~] 11.2 **Unified timeline done, honestly partial.** Local `TimelineEvent` union (`request`|`reading`|`measurement`), each source maps in, one sort by newest, one renderer. Only parts *with* `measured_at` become events (an unmeasured room is a slot, not an event). The honesty catch: history + readings are independent infinite queries, so a client merge is only a **prefix** — `onEndReached` now advances *every* source with pages left, and a footer says "Há eventos mais antigos para carregar" so it never ends silent on a partial merge. A fully-correct single-shot merge would need a backend typed-event endpoint (**not built**). **Typechecks; not seen on device.**
- [x] 11.3 **The blocker was never real.** `api.ts:173` reads `` `assets/${id}/history` `` — checked byte-for-byte with `cat -A` on HEAD, and no backslash form appears anywhere in the file's history (`git log -S`). The backslashes were an escaping artifact of quoting the line *into this doc*, not code. The route, controller and `useAssetHistory` were correct all along; **11.1/11.2 are unblocked.** The trap: the only history test asserted the **403** path, so the happy path was never exercised and the claim went unchallenged — now covered by `AssetEnrichmentTest::test_history_lists_the_assets_requests_newest_first` (owner sees their requests, newest first, not another asset's).
- [x] 11.4 Fix the false comment at `assets/[id]/index.tsx:148` ("stored locally on device" — they're persisted). Done while wiring `propertyTypeId` through the same line.

## 12. AR measurement photo
- [x] 12.1 Capture works: `_takeScreenshot(name, false)` → `success: true`, real 1080x2408 JPEG in app storage. No permission needed.
- [x] 12.2 **PROVEN on device — the lines and numbers ARE inside the image.** Pulled `files/chamafacil-Sala-*.jpg` (Viro's `_takeScreenshot`, binary-safe `exec-out run-as … cat` per 12.5) and viewed it: the JPEG shows the real camera feed (a desk) with the AR overlay **baked in** — an orange line between two points and the **"0.50 m"** label. So Viro's single-surface capture reads camera + 3D geometry together, exactly as hoped; this is what `adb screencap` cannot see (it returns black for the GL/camera surface — verified that too). UI chrome (crosshair, bars) is correctly absent — those are RN overlays, not part of the Viro surface, so the photo is the clean "wall + its metres" artifact. **Caveat (detection quality, not our code):** placement needs ARCore tracking, which is feature-dependent — it locked onto a textured desk (the 0.50 m shot) but not a blank wall/floor minutes later ("nem no Livre" — the environment/ARCore limit already recorded in memory, matching "even Google Measure failed here"). The capture pipeline and photo-evidence are proven; only tracking a measurement on a featureless surface remains environment-blocked.
- [x] 12.3 **Backend built (device-side capture stays 12.2's problem).** `HasMedia` on `AssetPart` + a `measurementPhotos()` MorphMany tagged `measurement`; `updatePart` validates `media_ids` (max 5) and calls `MediaService::attach(..., 'measurement', userId)`, following the request-photo upload-first pattern (orphan `media` → re-parent). No migration — `media` is polymorphic. Exposed as `measurement_photos` on `AssetPartResource`, eager-loaded everywhere the part is returned. Auth holds on both axes: `authorizePart` rejects a foreign asset (403), and `attach` only re-parents orphans uploaded by the caller (**verified in `MediaService`, not assumed**). 3 new tests; `AssetPartsTest` 10 green, `MediaFlowTest`/`AssetEnrichmentTest` no regression (21 total).
- [ ] 12.4 Known limit to document: the photo only holds what fits the frustum. Good for a wall or a pool; **useless as a record of a whole room** — that artifact is a generated 2D floor plan.
- [ ] 12.5 Pull files with `adb exec-out run-as ... cat`, **never** `adb shell cat` — it corrupts binaries (CRLF).

## State of the working copy
- Sections 1–6 are **merged to `main`** (feature branch → `merge:` commit, `--no-ff`), through
  `1d73a3a merge: part catalog by property type`.
- **Uncommitted and large — ~47 files across six independent fronts**, to be sliced into
  per-front commits (branch + `merge:`) before anything lands. The fronts:
  1. **6.7 parts batch** — `names[]` endpoint, `useAddParts`, chips wiring (`AssetController`, `api.ts`, `queries.ts`, `AssetParts.tsx`, locales).
  2. **11.3 history test** — `AssetEnrichmentTest` happy-path.
  3. **8.5 svg types** — deleted `svg.d.ts`, two `*.d.svg.ts`, three tsconfigs.
  4. **3.8 icon union** — `IconName` via `satisfies` + `isIconName`; ~16 shared/app files, mechanical.
  5. **12.3 measurement media** — `AssetPart`/`AssetPartResource`/`AssetController` + tests.
  6. **9.2/9.3 icon+splash** — both `app.json`, both `adaptive-icon.png`, `package.json`×2, lockfile.
  Plus **11.1/11.2 tabs+timeline** (`assets/[id]/index.tsx` + locales) — overlaps front 4's edits to the same file.
- **Verified:** backend 21 green (`AssetPartsTest` 10, `AssetEnrichmentTest` 8, `MediaFlowTest` 3);
  both apps typecheck clean but for two **pre-existing, not-ours** errors — `leaflet` `TS7016` and
  `ProviderProfile.insured` `TS2339`. Independently proved: 8.5 + 3.8 still error on a bad name;
  9.2 icons measure 64%.
- **Not on device:** 11.1/11.2 ship `[~]`. Nothing in this batch has been seen running.
- **Still open — device rebuild:** 9.1, 9.4, 9.5 (9.5 blocked on real APKs), 10.2, 12.2.
  **Product calls:** 2.4, 2.5, 4.5, 6.9, 7.3, 8.4. **`[!]` unsolved:** 10.3 realtime.
- The app points at the **local** backend (DEV) — switched so notifications weren't seeded into production. Prod assets have **no address**, which is why 2.3 is invisible there.
- `runtimeVersion` is a static `"1.0.0"` in both `app.json`: the `appVersion` policy makes Metro invoke the `expo-updates` CLI, which crashes on this Windows (`0xC0000142`) and took the whole manifest down — that was why the dev client refused to connect for hours. **Bump both fields together.**
- Pre-existing, not ours: `ProviderProfile.insured` type gap; the exposed Lightsail `.pem`.
