# SCREEN_INVENTORY

**Audit date:** 2026-06-22
**Apps:** Customer (`localhost:19083`) · Provider (`localhost:19082`) — Expo Router (react-native-web)
**Design reference:** `walvee/walvee Prototipo.html`, `walvee Pro.html`, `walvee Prestador.html`, `walvee v3 Cliente - Layouts.html`, `walvee-ui.css`, and `walvee/files/walvee-build-spec-v5.md` (V5).
**Method note:** Live browser automation (Preview MCP) could not attach to the Docker-served ports; the audit is grounded in source code, computed theme tokens vs `walvee-ui.css`, the V5 spec inventory, and native-emulator screenshots already captured. Visual/responsive items flagged "verify-on-web" should be confirmed in a browser pass.

## Customer app — routes

| # | Route (file) | Screen | V5 ref | State coverage in code |
|---|---|---|---|---|
| 1 | `(auth)/welcome` | Onboarding carousel | C04 Tutorial | slides, Skip/Next |
| 2 | `(auth)/login` | Login | C02 | phone/OTP entry |
| 3 | `(auth)/register` | Cadastro | C01 | form |
| 4 | `(auth)/verify` | Verificar código | C03 | OTP, resend |
| 5 | `(tabs)/home` | Início | C05 | active-request card, quick help, empty (no active) |
| 6 | `(tabs)/requests` | Meus pedidos | C27 | list (em andamento/anteriores) |
| 7 | `(tabs)/profile` | Conta | (Conta) | profile card, theme toggle, **Meus ativos** entry, logout |
| 8 | `categories` | Categorias | C06 | category grid |
| 9 | `request/new` | Criar pedido (wizard 4 passos) | C07/C08 | step1 problem + **asset selector**, step2 location/access, step3 when, step4 confirm+budget+payment |
| 10 | `request/[id]/index` | Pedido / propostas / em serviço | C09/C12/C18 | open (Q&A + proposals), active (provider/parts/surcharge/reschedule/no-show), requote, completed (rate/warranty/dispute) |
| 11 | `request/[id]/track` | A caminho | C15 | map (web placeholder), ETA |
| 12 | `request/[id]/rate` | Avaliar profissional | C21 | stars, tags, tip |
| 13 | `request/[id]/surcharge` | Acréscimo na chegada | C16 | tiers, approve/refuse, requote route |
| 14 | `request/[id]/requote` | Re-cotação | C40 🆕 | accept / reopen |
| 15 | `request/[id]/reschedule` | Remarcação (cliente) | C43 🆕 | propose / respond |
| 16 | `request/[id]/no-show` | Não apareceu | C35 | wait / reopen / cancel |
| 17 | `request/[id]/dispute` | Disputa + status | C37/C38 | open claim / mediation timeline |
| 18 | `request/[id]/warranty` | Garantia | C41/C42 | redo/refund + claims |
| 19 | `assets/index` | Meus ativos | C22 🆕 | list, empty, add CTA |
| 20 | `assets/new` | Adicionar ativo | C23 🆕 | type + fields |
| 21 | `assets/[id]` | Editar/arquivar ativo | C24 🆕 | edit, archive |

## Provider app — routes

| # | Route (file) | Screen | V5 ref | State coverage in code |
|---|---|---|---|---|
| 1 | `(auth)/welcome` | Onboarding | P01-ish | slides |
| 2 | `(auth)/login` · `register` · `verify` | Auth | P01 | forms/OTP |
| 3 | `onboarding` | Setup (categorias/área/docs) | P02 | wizard |
| 4 | `pending` | Aguardando aprovação | P03 | locked state |
| 5 | `(tabs)/dashboard` | Painel | P04 | online toggle, stats, in-progress, nearby preview, FAB, **drawer** |
| 6 | `(tabs)/jobs` | Trabalhos | P24-ish | list |
| 7 | `(tabs)/agenda` | Agenda | P24 🆕 | list |
| 8 | `(tabs)/profile` | Conta | P20 | menu rows |
| 9 | `nearby` | Chamados próximos | P05/P06/P07 | **Lista / Mapa / Agenda** tabs + **filter bottom sheet** |
| 10 | `edit-profile` | Editar perfil | P21 | form (+ insurance toggle pending UI) |
| 11 | `config` | Meus serviços / config | P22 | services |
| 12 | `earnings` | Ganhos & saques | P23 | wallet |
| 13 | `job/[id]/index` | Trabalho ativo / bid flow | P09/P16 | bid wizard, management, parts, completed (rating shown), **asset card** |
| 14 | `job/[id]/rate-client` | Avaliar cliente | P18 | stars/tags/preferred |
| 15 | `job/[id]/surcharge` | Compor acréscimo | P15 🆕 | amount/reason/photo, tier preview |
| 16 | `job/[id]/reschedule` | Remarcação (pro) | P25 🆕 | propose / respond |
| 17 | `job/[id]/dispute` | Defesa na disputa | P19 🆕 | claim + defense |

## Overlays / non-route UI
- **AppDrawer** (both apps) — hamburger drawer (custom Modal overlay).
- **FilterSheet** (provider nearby) — bottom sheet (Modal).
- **Map pin sheet** (provider nearby map) — absolute card.
- **Alerts** — `Alert.alert` used for all confirmations/errors/success (renders as native browser dialog on web — see DESIGN_AUDIT).
- **Surcharge sheet / Add-part sheet** (provider job).

## Coverage
- **Customer screens:** 21 routes (+ asset add/edit), all reachable.
- **Provider screens:** 17 routes, all reachable.
- **States:** loading (ActivityIndicator), empty, and error-via-Alert present on most data screens. Dedicated visual error screens are largely absent (errors surface through `Alert.alert`).
