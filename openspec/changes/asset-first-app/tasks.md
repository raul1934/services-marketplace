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
- [ ] 2.5 "Ajuda rápida" is still 100% vehicle (Guincho, Bateria, Troca de Pneu, Combustível) on an asset-first home. Product decision, not layout.

## 3. Alerts (the bell)
- [x] 3.1 `Api/NotificationController.php`: `index` (paginated), `unreadCount`, `markRead`, `markAllRead`.
- [x] 3.2 `NotificationResource`: `type` comes from **`data['type']`** (the app-facing kind), *not* the `type` column, which is the PHP class name.
- [x] 3.3 Routes on **both** `customer_api.php` and `provider_api.php`, `auth:sanctum` without `abilities` — a user's notifications are their own whichever app asks.
- [x] 3.4 `NotificationListTest.php` — 7 tests (scoping, cross-user 404, both apps, the `type` mapping).
- [x] 3.5 `app/notifications.tsx` + `src/notificationLinks.ts` (icon + route per kind, **additive**: an unknown kind lists fine and just doesn't navigate).
- [x] 3.6 `badge` prop on the shared `IconButton`; wired to `useUnreadCount`.
- [x] 3.7 Verified end-to-end: badge 3 → 2 on read, backend confirms.
- [x] 3.9 Chased a badge reading **1** where 2 was expected. **Not a bug** — the database agreed (1 unread of 3); a stray test tap had opened a second notification. Checked before "fixing"; the count is trustworthy. Note the DB stamps `read_at` in **UTC** (local is UTC-3), which is what made it look wrong.
- [ ] 3.8 **Icon names must be checked against `frontend/icons/*.svg`** — 4 of my first choices (`file`, `money`, `refresh`, `alert`) don't exist and would have failed at runtime, not typecheck.

## 4. Onboarding
- [x] 4.1 `FirstAssetTutorial.tsx`: full-screen, opens by default when `useAssets()` is empty, 3 steps, skippable.
- [x] 4.2 Copy speaks of **assets** (house, car, pet), not just property — `AssetType` is `vehicle | property | pet`.
- [x] 4.3 Uses `Modal`, not an absolute overlay: it renders from inside the home's ScrollView, where `position: absolute` is clipped to the content box.
- [x] 4.4 Remembers being skipped (`chamafacil.firstAsset.seen`); the home card stays as the quiet invitation. Without this it nags on every visit.
- [ ] 4.5 **The guided flow itself does not exist.** What ships is a welcome screen. The real ask — address → offer the parts for that type → measure the first one — is task 6.

## 5. Theme
- [x] 5.1 `lib/theme-pref.ts` (`ui_theme`), mirroring `lib/language.ts`.
- [x] 5.2 `ThemeProvider` works in **modes** (`auto`/`light`/`dark`), hydrated on boot. Which brand palette an app wears is not a user choice — offering it let a client pick `trust`, the **provider's** palette.
- [x] 5.3 Both profile pickers: Automático / Claro / Escuro.
- [x] 5.4 Verified: picked Escuro → killed the app → it reopened dark. Previously the override was plain `useState` and died on close.
- [ ] 5.6 Verify the **provider** app's picker (only the client's was seen).
- [ ] 5.5 Audit hardcoded `#ff6a3d` in `SplashBrand.tsx` / `UpdateBanner.tsx`. **Do not** theme the AR module (`ar/styles.ts`, `ar/materials.ts`) — it is a camera overlay, deliberately black/white.

## 6. Asset part catalog (not started)
- [ ] 6.1 `part_types` (`id`, `name`, `slug`, `position`).
- [ ] 6.2 Pivot `part_type_property_type` with **`default_selected`** — many-to-many, because "Sala" serves casa *and* apartamento.
- [ ] 6.3 `PropertyTypeSeeder`: add **Edícula** (today: Apartamento, Casa, Casa em condomínio, Sobrado, Cobertura, Kitnet/Studio, Flat, Sala comercial, Loja, Galpão, Terreno, Chácara/Sítio, Fazenda, Garagem/Vaga).
- [ ] 6.4 `PartTypeSeeder`, idempotent. **Edícula → piscina pre-checked**; Casa → piscina offered, unchecked.
- [ ] 6.5 Endpoint alongside the existing catalog (see `AssetCatalogTest.php` for the shape).
- [ ] 6.6 `AssetParts.tsx`: suggestion chips, defaults checked, with *"pré-selecionamos com base no tipo — desmarque o que não tiver"*. Keep the free-text field: the catalog **suggests, it does not restrict**.
- [ ] 6.7 `addPart` accepts only `{ name }` today — creating N parts needs a batch endpoint or N calls. Decide in `design.md`.
- [ ] 6.8 Pre-checking a part is honest: a part is an **empty slot to measure** (`area: null` → "Sem medição"). This is why it differs from seeding `size: "120 m²"`.

## 7. Sensible defaults
- [~] 7.1 Request wizard: with exactly one asset of the type, pre-select it + note under the list. Never overrides an existing pick (including the `?pick=1` round-trip).
- [ ] 7.2 Verify on device (needs an account with exactly one vehicle).
- [ ] 7.3 Find the other cases the user mentioned. Likely: address/coords from `getCurrentCoords`/`reverseGeocode` (`src/location.ts`, already used by the request wizard), and values carried from the user's **other assets** (same condo, same street) — real data, not guesses. **Ask before inventing the list.**

## 8. Brand inside the app
- [x] 8.1 `welcome` (both apps): plain `<Text>Chama Fácil</Text>` → `BrandMark` (logo + wordmark). It already existed; login already used it.
- [x] 8.2 Decorative blobs were drawn **after** the header, on top of it, with no `pointerEvents="none"` — they swallowed taps on the `EnvSwitch`. Reordered + marked untouchable.
- [~] 8.3 Verify the DEV/PROD toggle now responds on the welcome screen.
- [ ] 8.4 **The logged-in app still has no brand anywhere.** It exists only on `login`, `register` and `SplashBrand` — all *before* you sign in. `AppDrawer` has zero references; its header shows the user's avatar. This is the user's actual complaint.
- [ ] 8.5 Kill the `.svg` `TS2307` errors (`svg.d.ts` doesn't reach the app tsconfig). They're the logo's, and filtering them as "known noise" is how 8.4 stayed invisible for so long.

## 9. Launcher icon & splash (not started)
- [ ] 9.1 The installed APK is **Walvee, 2026-07-11** — four days before the rebrand. That's why no icon shows. The artwork is fine.
- [ ] 9.2 Adaptive icons are undersized: Android keeps only the central 72dp of a 108dp canvas. The client's flame covers 34%; the provider's mark **~6%** — it reads as "no icon". Target 60–70%; derive from `brand/avatar-*.png` (512×512, already composed, unused).
- [ ] 9.3 **`expo-splash-screen` is not installed** but both `app.json` still use the legacy `splash` key, which is that plugin's. The next `prebuild --clean` **drops the splash silently**.
- [ ] 9.4 Provider's `android/` predates the rebrand by 4 days → stale Walvee mipmaps. Only `expo prebuild --clean` regenerates.
- [ ] 9.5 `landing/version.json` advertises APKs that don't exist (`landing/downloads/` holds a README). The download links 404 today.

## 10. Push & realtime
- [ ] 10.1 Backend is **already built**: `PushTokenController`, `UserDevice`, `user_devices`, and `POST/DELETE push/token` routes exist. `ExpoChannel` talks to `exp.host` and needs **no server credentials**, only the token.
- [ ] 10.2 App side missing entirely: install `expo-notifications`, register the `ExponentPushToken` on login, drop it on logout, handle the tap → same deep-link map. **Needs a native rebuild** — pair with task 9.
- [!] 10.3 **Realtime is broken and always has been.** `laravel-echo` + `pusher-js` are installed and `packages/shared/src/realtime/echo.ts` is written, but `new Echo(...)` throws *"Object cannot be used as a constructor"* under Hermes — any screen calling `getEcho()` throws. My CJS/ESM interop theory was **wrong**: the unwrap returns a value reporting `typeof === 'function'` and `new` still fails. Cause unknown. Marked `KNOWN BROKEN` in the file.
- [ ] 10.4 `BROADCAST_CONNECTION=log` in `.env.example` — Reverb isn't on, though a `reverb` service exists in the compose. Needs `/broadcasting/auth` for private channels with Sanctum.

## 11. Asset detail tabs (not started)
- [ ] 11.1 Two tabs: **"Imóvel"** (identity + address/map + rooms) and **"Histórico"**. Different natures — one you edit and act on, one you read. Today it's one endless scroll.
- [ ] 11.2 Unified timeline, free from the model: `asset_parts.measured_at` + odometer readings + requests.
- [ ] 11.3 **Blocker**: `assetsApi.history` is broken — `src/api.ts:173` has `` `assets\${id}\history` ``; the escaped backslashes kill interpolation, so it requests a literal string. History doesn't load today.
- [ ] 11.4 Fix the false comment at `assets/[id]/index.tsx:148` ("stored locally on device" — they're persisted).

## 12. AR measurement photo
- [x] 12.1 Capture works: `_takeScreenshot(name, false)` → `success: true`, real 1080x2408 JPEG in app storage. No permission needed.
- [ ] 12.2 **UNPROVEN and blocking: are the lines and numbers actually inside the image?** The test landed on an empty scene in the dark (reload zeroes the points — they live in JS). Viro renders camera + 3D into one GL surface, which is what `takeScreenshot` reads, so it *should* — but that's expectation, not evidence. **Verify before building anything else here.**
- [ ] 12.3 Upload on save: `use HasMedia` on `AssetPart` + `MediaService::attach($ids, $part, 'measurement', $userId)` + expose on `AssetPartResource`. Same pattern as request photos.
- [ ] 12.4 Known limit to document: the photo only holds what fits the frustum. Good for a wall or a pool; **useless as a record of a whole room** — that artifact is a generated 2D floor plan.
- [ ] 12.5 Pull files with `adb exec-out run-as ... cat`, **never** `adb shell cat` — it corrupts binaries (CRLF).

## State of the working copy
- **Nothing is committed.**
- The app points at the **local** backend (DEV) — switched so notifications weren't seeded into production. Prod assets have **no address**, which is why 2.3 is invisible there.
- `runtimeVersion` is a static `"1.0.0"` in both `app.json`: the `appVersion` policy makes Metro invoke the `expo-updates` CLI, which crashes on this Windows (`0xC0000142`) and took the whole manifest down — that was why the dev client refused to connect for hours. **Bump both fields together.**
- Pre-existing, not ours: `ProviderProfile.insured` type gap; the exposed Lightsail `.pem`.
