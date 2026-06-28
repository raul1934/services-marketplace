# COMPONENT_INVENTORY

Shared UI kit: `frontend/packages/shared/src/ui/`. Tokens: `frontend/packages/shared/src/theme/themes.ts` (ported 1:1 from `walvee-ui.css`). Consumed by both apps via `@walvee/shared`.

## Design tokens (verified vs `walvee-ui.css`)

| Token group | App value (sunset) | Prototype `walvee-ui.css` | Match |
|---|---|---|---|
| bg / surface / surface2 | `#eef2f7 / #ffffff / #f6f8fc` | same | ✅ |
| ink / ink2 / ink3 | `#15233b / #5b6b82 / #95a2b6` | same | ✅ |
| line / line2 | `#e7ecf3 / #eef2f7` | same | ✅ |
| accent / accent2 / accentInk / accentSoft | `#ff6a3d / #ffb23e / #fff / #fff0ea` | same | ✅ |
| ok / danger / warn | `#12b981 / #f0455b / #f59e0b` | same | ✅ |
| grad | `#ff8a4c→#ff5a6e→#ffb23e` | same stops | ✅ |
| radius card/btn/field | `22 / 999 / 16` | same | ✅ |
| shadow / shadowSm | offset+opacity ported | approximated from CSS box-shadow | ✅ (RN approximation) |
| fonts | Manrope / Space Mono | same | ✅ |
| themes | sunset / trust / night | sunset / trust / night | ✅ |

**Finding:** token fidelity is excellent — the theme is a faithful port. Discrepancies are at the **component/screen/runtime** layer, not the token layer.

## Components

| Component | File | Variants / props | Notes |
|---|---|---|---|
| Text | `Text.tsx` | variant (h1/h3/caption/label), weight, color, center | Renders RN `Text` → `<div>`/`<span>` on web (no semantic heading tags) |
| Icon | `Icon.tsx` | name, size, color, fill, strokeWidth | **Now lucide-react-native** (migrated from generated SVGs); fallback = search |
| IconButton | `primitives.tsx` | name, onPress, size | 40px round; web focus ring not styled |
| AppBar | `primitives.tsx` | sub, title, **left**, right | `left` slot added for the drawer hamburger |
| BackBar | `primitives.tsx` | title, onBack, right | back uses `router.canGoBack()` fallback |
| SectionLabel, Row, Price, AvInit, AvatarGrad, CatIc, CatTile, FieldDisplay, Steps, Toggle, SuggPill | `primitives.tsx` | — | presentational |
| Button | `Button.tsx` | variant grad/solid/ghost/soft/ok/danger, size sm/md/lg, full, left/right, loading | pressed scale only — **no hover/focus state on web** |
| Card | `Card.tsx` | flat, onPress, padded | onPress → Pressable |
| Badge | `Badge.tsx` | label, tone (open/live/neutral/urgent), dot | |
| Chip | `Chip.tsx` | label, active, onPress | |
| Field | `Field.tsx` | label, error, hint, right, voiceInput, multiline, … | mic = web STT / native focuses keyboard; **error not programmatically tied to input (no aria-describedby)** |
| Segment | `Segment.tsx` | items, value, onChange | tab-like single select |
| PaymentSelector, DynamicFields, AnswerList, QnaThread | resp. files | — | composed inputs |
| Avatar, Stars | resp. files | name/uri/size; value/size/onChange | |
| Screen | `Screen.tsx` | scroll, padded, edges | SafeAreaView + optional ScrollView; **no maxWidth (phone layout stretches on desktop)** |
| SlideToConfirm | `SlideToConfirm.tsx` | label, doneLabel, onConfirm, variant, compact | PanResponder (works with mouse on web) |
| BudgetMeter | `BudgetMeter.tsx` | value/min/max/band/mode | pricing gauge |
| Wiz | `Wiz.tsx` | step/total/title/footer | wizard shell |
| **AppDrawer** | `AppDrawer.tsx` 🆕 | sections, footer, header | custom Modal overlay (no edge-swipe gesture) |

## Composition / reuse observations
- **Asset-summary card** is hand-rolled in 3+ places (provider `AssetCard`, customer asset list rows, request/new selector). Candidate for a shared `AssetRow`.
- **Pin/sheet** patterns (FilterSheet, surcharge sheet, drawer, map sheet) each re-implement a Modal+overlay; a shared `BottomSheet` primitive would remove duplication.
- **Stat row / breakdown line** (`TotalLine`, `SumRow`, `Stat`, `Line`) re-implemented per screen — could be one `KeyValueRow`.
- **initialsOf()** helper duplicated across ~8 screens — should live in shared.
- **Alert.alert** used pervasively for errors/success — no shared toast component (see DESIGN_AUDIT DS-02).
