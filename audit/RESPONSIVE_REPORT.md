# RESPONSIVE_REPORT

**Apps:** Customer (19083) / Provider (19082), Expo web. **Reference:** prototype is a fixed `Phone` frame (390×844). **Method:** code review of `Screen`/layout + token analysis; per-breakpoint visual confirmation marked **(verify-on-web)**.

## Core finding (RESP-01, High)
The web build does **not** constrain content to a phone column. `ui/Screen.tsx` applies only `paddingHorizontal: 20` (no `maxWidth`, no centering). React Native flexbox prevents horizontal overflow, but the **mobile composition stretches to the full viewport width** beyond ~480px.

## Per-breakpoint expectation

| Width | Target use | Expected | Likely actual | Note |
|---|---|---|---|---|
| 320 | small phone | usable | OK (tight) | designed min; verify chips/rows wrap |
| 375 | iPhone SE/13 mini | ideal | OK | near design width |
| 390 | design width | ideal | OK | matches `Phone` 390 |
| 414/430 | large phones | ideal | OK | |
| 768 | tablet | phone column centered | **stretched full-width** | RESP-01 |
| 1024 | tablet land. | centered column | **stretched** | RESP-01 |
| 1280 | desktop | centered column | **stretched, very wide rows** | RESP-01 / RESP-02 |
| 1440 | desktop | centered column | **stretched** | |
| 1920 | desktop | centered column | **stretched; tab bar/FAB span full width** | RESP-02 |

## Component behavior at wide widths
- **Cards/rows** become very wide (long line lengths; avatars/labels far from values).
- **Bottom tab bar** (fixed 84px) spans the entire width; fine in a phone column, stranded full-width.
- **Provider nearby**: floating List/Map/Agenda toggle (centered) + filter sheet are phone-sized over a wide canvas.
- **Dashboard FAB** sits bottom-right of the full viewport.
- **Bottom sheets / drawer**: drawer panel is `84%`/max 360 (OK); sheets span full width (fine on phone, wide on desktop).
- **Maps**: placeholder regardless of width (VIS-01).

## No-overflow positives
- Flex layouts and `flexWrap` on chip rows avoid horizontal scrollbars.
- `numberOfLines` guards truncate long text in rows.
- `ScrollView` regions added this session (nearby list/agenda, dashboard) scroll correctly; floating elements are fixed siblings (footer/FAB bugs already fixed).

## Recommendation
1. **RESP-01:** wrap app content in a centered max-width (~440–480px) phone column on web (and/or a `web`-specific frame), OR design a true desktop layout. This single change resolves most desktop issues including RESP-02.
2. Re-test at 768/1280/1920 after the column is added.

## Responsive compliance score
**~65/100.** Mobile (320–430) is solid; tablet/desktop is unconstrained. One structural fix (`Screen` max-width) lifts this substantially.
