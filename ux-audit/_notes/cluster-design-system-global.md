# Cluster — Design System + Estados Globais + Notificações/Realtime + Débito Técnico de UI

Auditoria: Design System Architect + Front-end Architect + A11y (WCAG 2.2).
Raiz: `frontend/`. Pacote compartilhado: `packages/shared/src`. Apps: `apps/customer`, `apps/provider`.
Data desta análise: 2026-07-20. Postura: extremamente crítica.

> **Nota de reconciliação de marca (importante).** Os relatórios em `audit/` (2026-06-22) referem-se a `@walvee/shared` e `walvee-ui.css`. O código atual usa `@chamafacil/shared` e o comentário de origem `chamafacil-ui.css` (`themes.ts:1-2`). Houve rebrand **walvee → chamafacil** posterior à auditoria original, mas **os valores de token foram portados 1:1** (accent `#ff6a3d`, ink3 `#95a2b6`, radius 22/999/16 etc. batem exatamente). Portanto todas as constatações de contraste/token dos relatórios antigos **continuam válidas** — o rebrand foi só de nome de pacote, não de paleta.

---

## 0. Sumário executivo (mais graves primeiro)

| # | Severidade | Título | Evidência |
|---|---|---|---|
| C1 | **Crítico** | Contraste WCAG AA reprovado sistemicamente (accent, ok, danger, ink3, botão soft/badge) | `themes.ts:64-72`, `Text.tsx:25-26`, `Button.tsx:42-49` |
| C2 | **Crítico** | Zero detecção de conectividade: sem NetInfo, sem banner offline global, sem fila offline | busca global (0 usos de NetInfo em código de app) |
| C3 | **Alto** | `<Sheet>`/`<BottomSheet>` ausente do kit → 6+ reimplementações idênticas de Modal+backdrop+grab handle | `DictationModal.tsx:104-110`, `RequestFilterSheet.tsx:51-57`, `RecordKmSheet.tsx:63-69`, `SinglePicker.tsx:43-49`, `LinkedPicker.tsx:86-92`, `DatePicker.tsx:88-94` |
| C4 | **Alto** | Sem escala de spacing em tokens → números mágicos (12/13/14/16/18/20/22…) espalhados | `themes.ts:44` (radius existe, spacing não); `primitives.tsx` passim |
| C5 | **Alto** | Estados de erro de _query_ não renderizados (sem error/retry UI); erros globais via `Alert.alert` (janela nativa no web) | reconciliação FUNC-01 / DS-02 |
| C6 | **Alto** | Primitives com tipografia inline (fontSize/fontWeight cru) em vez de variantes `<Text>` → drift tipográfico | `primitives.tsx:129-131,149,162,166,212-214,236`, `Wiz.tsx:53,55,68`, `notifications.tsx:78` |
| C7 | **Médio** | Skeleton e ActivityIndicator coexistem como padrão de loading sem regra clara | `PaginatedList.tsx:103-104` (skeleton) vs `dashboard.tsx:141` (spinner) |
| C8 | **Médio** | A11y: focus ring só no web; alvos de toque < 44px; labels de ícone ausentes | `a11y.ts:9-13`, `notifications.tsx:39`, `primitives.tsx:143-147` |

---

## 1. Tokens

### 1.1 O que existe e está bom
`Theme` (`themes.ts:18-50`) é tipado e completo em **cores** (bg, surface, surface2, ink/ink2/ink3, line/line2, accent/accent2/accentInk/accentSoft, ok/okSoft, danger/dangerSoft, warn, statusbarInk), **radius** (`{ card, btn, field }`, `themes.ts:44`), **shadow/shadowSm** (`themes.ts:45-46,78-79`), **gradientes** (`grad`/`gradSoft`), **fontes** (`font.body/head/mono`) e **headWeight**. Três temas: `sunset`, `trust`, `night` (`themes.ts:52-146`). Fidelidade de token é o ponto forte do sistema — confirmado por COMPONENT_INVENTORY.md:20.

### 1.2 FALTA: escala de spacing — **Alto (C4)**
- **Não existe** nenhum token de spacing. `themes.ts:44` define `radius` mas nada de `space`/`gap`. Busca por `spacing`/`gap:` em `theme/` retorna **0 ocorrências**.
- Consequência: números mágicos de espaçamento **hardcoded em cada componente**. Amostra só em `primitives.tsx`: `gap: 12` (`:125`), `gap: 6` (`:142`), `gap: 8` (`:161`), `gap: 13` (`:174` — default do `Row`!), `paddingHorizontal: 20` (`:125`), `paddingHorizontal: 16` (`:142`), `paddingVertical: 9` (Chip `:9`), `padding: 18` (Card `:17`), `paddingTop: 10/4`, `paddingBottom: 14/10`. Em `Wiz.tsx`: `paddingBottom: 26` (`:75`), `paddingBottom: 24` (`:66`). Em sheets: `paddingBottom: 28 + insets.bottom` vs `24 + insets.bottom` (divergência entre `DatePicker.tsx:92` e `SinglePicker.tsx:47`).
- **Drift real observado**: o gap de "linha" é `13` no `Row` (`primitives.tsx:174`) mas `12` no `notifications.tsx:64` (`<Row gap={12}>`), `10`/`14`/`16` em outros. Não há fonte única.
- Radius de campo também tem número mágico paralelo: sheets usam `borderTopLeftRadius: 26` cru (6 arquivos) em vez de um `t.radius.sheet`.

**Proposta (evolução do DS):** introduzir escala de spacing 4-pt no `Theme`:
```ts
// themes.ts — adicionar ao interface Theme e a cada tema (compartilhado entre os 3)
space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
radius: { card: 22, btn: 999, field: 16, sheet: 26 }; // +sheet
```
E migrar `Row`/`Screen`/`Card` para consumir `t.space.*`. Ganho: consistência mensurável e refatoração de tema única.

### 1.3 Tipografia — token incompleto
- A escala tipográfica **não é token** — vive hardcoded dentro de `Text.tsx:19-28` (h1 28, h2 22, h3 17, body 15, label 13, caption 12, mono 14). Não há `t.type.*`. Aceitável porque centralizado em `<Text>`, **desde que todos usem `<Text variant>`** — o que não acontece (ver §6/C6).
- `manropeFor()` (`fonts.ts:17-24`) mapeia peso→família por faixas (`>=750→800`, `>=650→700`…). Correto, mas duplica a lógica do `Text.tsx:58-60` que faz sua própria escolha para `mono`. Aceitável.

### 1.4 Shadow/radius — OK com ressalva
- `radius.btn: 999` (`themes.ts:77`) é pill total no sunset/night mas `12` no trust (`themes.ts:109`). Ok (é decisão de marca). Porém componentes assumem pill em vários lugares hardcoded (`borderRadius: 999` em Badge `:27`, Chip `:26`, SuggPill `:295`) em vez de `t.radius.btn` — se o tema trust for aplicado a um desses, ficam inconsistentes com os botões. **Médio.**

---

## 2. Componentes (catálogo + duplicações + inconsistências)

### 2.1 Catálogo do UI kit (`packages/shared/src/ui`, export em `index.ts`)
`Text`, `Icon` (+`IconButton`, `AvatarGrad`, `AppBar`, `BackBar`, `SectionLabel`, `Row`, `CatIc`, `CatTile`, `Price`, `AvInit`, `FieldDisplay`, `Steps`, `Toggle`, `SuggPill` em `primitives.tsx`), `Button`, `Card`, `Badge`, `Chip`, `Field`, `Segment`, `PaymentSelector`, `DynamicFields`, `AnswerList`, `QnaThread`, `Avatar`, `Stars`, `Screen`, `SlideToConfirm`, `SuccessSplash`, `BudgetMeter`, `Wiz`, `AppDrawer`, `EmptyState`, `NotFoundView`, `DictationModal`, `PaginatedList`, `Skeleton`(+`SkeletonCard/List/Tiles/Screen`), `UpdateBanner`, `TestBanner`(+`TestBadge`), `MiniMap`, auth (`AuthField`, `BrandMark`, `DividerOr`, `GoogleButton`, `OtpInput`).

### 2.2 Duplicação crítica: falta `<Sheet>` — **Alto (C3)**
Seis componentes reimplementam o **mesmo** bottom-sheet (Modal transparente + backdrop `rgba(0,0,0,0.45)` + `justifyContent:'flex-end'` + Pressable de fundo que fecha + Pressable interno com `stopPropagation` + grab handle `40×5` + `borderTopLeftRadius: 26` + `paddingBottom: 24|28 + insets.bottom`):

| Arquivo | Linhas do bloco Modal | Handle |
|---|---|---|
| `DictationModal.tsx` | `104-110` | `:110` |
| `RequestFilterSheet.tsx` | `51-57` | `:57` |
| `RecordKmSheet.tsx` | `63-69` | `:69` |
| `SinglePicker.tsx` | `43-49` | `:49` |
| `LinkedPicker.tsx` | `86-92` | `:92` |
| `DatePicker.tsx` | `88-94` | `:94` |

**Prova de copy-paste:** o comentário
`// Modals render outside the screen's SafeAreaView, so the sheet has to // clear Android's navigation bar itself.`
aparece **verbatim, com a mesma quebra dupla de linha esquisita**, em `RequestFilterSheet.tsx:43-45`, `RecordKmSheet.tsx:32-34`, `SinglePicker.tsx:25-27`, `LinkedPicker.tsx:43-45`, `DatePicker.tsx:30-32`, `DictationModal.tsx:41-43`. Além destes, há mais Modais nos apps (`apps/provider/src/components/StartCodeModal.tsx`, `apps/customer/app/request/[id]/index.tsx`, `apps/provider/app/job/[id]/*`, `nearby.tsx`) — a busca por `<Modal` em `apps/` retorna **15 arquivos**.

Divergências já introduzidas pela duplicação (bugs de consistência):
- `paddingBottom`: `28 + insets.bottom` em Filter/RecordKm/Date/Dictation vs `24 + insets.bottom` em Single/Linked.
- `SinglePicker`/`LinkedPicker` **não têm** `accessibilityLabel` no botão de fechar (`SinglePicker.tsx:52`, `LinkedPicker.tsx:95`) enquanto `RequestFilterSheet.tsx:60` tem. A11y desigual.
- Nenhum implementa gesto de arrastar-para-fechar nem animação de slide (todos `animationType="fade"`), apesar do grab handle sugerir arrasto — **affordance mentirosa**.

Isto reconcilia e **amplia** DS-03/COMPONENT_INVENTORY.md:48 (que contava 4 sheets); o número real de reimplementações do padrão sheet no kit compartilhado + customer é **6**.

**Proposta — extrair `<Sheet>` para `packages/shared/src/ui/Sheet.tsx`:**
```ts
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;                 // renderiza header padrão (h3 + botão fechar acessível)
  children: React.ReactNode;
  maxHeightPct?: number;          // default 85
  showHandle?: boolean;           // default true
  dismissable?: boolean;          // backdrop/botão fecham? default true
}
// Encapsula: Modal transparent, backdrop rgba, insets.bottom, radius.sheet,
// grab handle, accessibilityViewIsModal, foco inicial, botão fechar com
// accessibilityLabel padronizado, e (evolução) pan-to-dismiss opcional.
```
Reduz ~6 blocos idênticos a `<Sheet visible title>…</Sheet>`, unifica a11y e paddings, e dá um único lugar para adicionar animação de slide.

### 2.3 Inconsistência: primitives com tipografia inline — **Alto (C6)**
Vários primitives/telas **não** usam `<Text variant>` e sim `fontSize`/`fontWeight` cru, furando a escala tipográfica:
- `primitives.tsx`: `AppBar` sub `fontSize:13,fontWeight:'600'` (`:129`) e title `fontSize:26` (`:131`); `BackBar` title `fontSize:19` (`:149`); `SectionLabel` `fontSize:12,fontWeight:'800'` (`:162`); `Price` `fontSize:13` (`:213`); `FieldDisplay` labels `fontSize:12` (`:236`).
- `Wiz.tsx`: `cat` `fontSize:19` (`:53`), `ETAPA` `fontSize:12.5` (`:55`), title `fontSize:23` (`:68`), sub `fontSize:13.5` (`:69`).
- `notifications.tsx:78` título de linha `fontSize:14.5` inline.
- Fontsizes fracionários improváveis de reuso: `12.5`, `13.5`, `14.5`, `11.5`, `12.5` — sintoma clássico de ausência de escala.

**Proposta:** ampliar `Variant` em `Text.tsx:8` com `h3`/`title`/`overline` e obrigar primitives a consumi-las; `SectionLabel` deveria ser `variant="overline"`. Adicionar regra de lint (proibir `fontSize` literal fora de `Text.tsx`).

### 2.4 Componentes divergentes de botão/input/card
- **Botão duplicado fora do kit:** `PickerField` (`LinkedPicker.tsx:129-146`) e `FieldDisplay` (`primitives.tsx:231`) e `DatePicker` trigger (`DatePicker.tsx:80-86`) reimplementam o mesmo "campo clicável" (surface2 + border 1.5 line + radius.field + minHeight 50 + ícone à direita). São **três** cópias do mesmo input-display. **Médio.** Extrair `<SelectField>`.
- **Toggle não é interativo:** `Toggle` (`primitives.tsx:282-289`) é **puramente visual** (`{ on: boolean }`, sem `onValueChange`, sem `Pressable`, sem `accessibilityRole="switch"`). É uma mentira de componente — quem quiser um switch real precisa embrulhar em Pressable externo (como o dashboard faz). **Médio.**
- **Dois "Badge" com o mesmo nome:** `Badge` exportado (`Badge.tsx`, pílula de status com `tone`) e `Badge` interno de contagem (`primitives.tsx:43-103`, o dot de not-lidas). Nomes colidem conceitualmente; o de contagem nem é exportado. Confuso.
- **Card:** OK e coeso (`Card.tsx`). Bom uso de `focusRing`.

---

## 3. Cores / contraste (WCAG 2.2) — **Crítico (C1)**

Cálculos definitivos (fórmula WCAG, tema `sunset` sobre `surface #ffffff`), resolvendo a divergência entre DESIGN_AUDIT (valores subestimados) e ACCESSIBILITY_REPORT:

| Par | Uso | Razão medida | AA normal (4.5) | AA UI/large (3.0) |
|---|---|---|---|---|
| `ink3 #95a2b6` / white | caption, placeholder, timestamps | **2.59:1** | ❌ | ❌ |
| white / `accent #ff6a3d` | **CTA primário (grad/solid)** | **2.85:1** | ❌ | ❌ |
| `accent` / `accentSoft #fff0ea` | botão `soft`, badge `open`, SuggPill | **2.54:1** | ❌ | ❌ |
| white / `ok #12b981` | botão `ok`, badge live | **2.57:1** | ❌ | ❌ |
| white / `danger #f0455b` | botão `danger` (na verdade usa dangerSoft) | **3.71:1** | ❌ | ✅ |
| `ink2 #5b6b82` / white | texto secundário | ~5.4:1 | ✅ | ✅ |

Pontos críticos:
- **`ink3` como cor de texto legível** — o próprio comentário admite a falha (`Text.tsx:25-26`: "ink3 (~2.6:1) did not [meet AA]"), **mas o código usa ink3 como texto assim mesmo**: `SectionLabel` (`primitives.tsx:162`), `FieldDisplay` label (`primitives.tsx:236`), `Steps` número (`:268`), timestamp de notificação (`notifications.tsx:87`), placeholder do TextInput (`Field.tsx:56`). Reprovado 1.4.3.
- **CTA primário 2.85:1** — o botão `grad` (o mais importante do app) tem texto branco 16px/700 sobre laranja: **falha AA e falha até o limiar de 3:1**. `Button.tsx:43,59`.
- **Botão `soft` 2.54:1** (`Button.tsx:48`, accent sobre accentSoft) — pior ainda; falha inclusive UI 3:1.
- **Hardcoded hex fora do token:** 28 ocorrências de hex literais em `ui/` (`primitives.tsx` 6×, `UpdateBanner.tsx` 6×, `EmptyState.tsx`, `Button.tsx`, `Skeleton`…). Dominante é `#fff`/`'#fff'` para texto sobre gradiente (`primitives.tsx:96,113,223,268`, `Button.tsx:47`, `EmptyState.tsx:49`), que **é** o par 2.85:1 reprovado. `UpdateBanner.tsx` usa `shadowColor:'#000'` e `color:'#fff'` crus (`:41,50,55`).

**Proposta:**
1. Escurecer `accent` para um tom que dê ≥4.5:1 com branco (ex.: `#d94a1f`) **ou** trocar o texto do CTA para `ink` escuro. Recomputar `accentInk` por tema.
2. Adicionar tokens `accentText`/`okText`/`dangerText` (versões escuras) para uso em fundos `*Soft` e proibir `accent` como cor de texto sobre `accentSoft`.
3. Reclassificar `ink3` como **decorativo apenas** (bordas, ícones grandes) e migrar todo texto ink3→ink2 (uma mudança em `Text.tsx:26` cobre `caption`; as usos inline precisam varredura).

---

## 4. Acessibilidade global (WCAG 2.2) — **Médio/Alto (C8)**

### 4.1 Cobertura de `accessibilityRole`/`Label`
- **Bom:** `Button` (`role="button"`+`accessibilityState.disabled`, `:81-82`), `Chip` (`role=button`+`selected`, `:20-21`), `IconButton` (`role=button`+label fallback, `:27-28`), `Field` mic (`:74-75`), `TestBanner` (`role="alert"`, `:37`).
- **Falhas:**
  - `IconButton` usa **o nome do ícone** como label fallback (`accessibilityLabel ?? name`, `primitives.tsx:32`) → leitor de tela anuncia "bell", "menu" em inglês técnico. 4.1.2.
  - `BackBar` botão de voltar **sem** `accessibilityRole`/`Label` (`primitives.tsx:143-147`). Ação crítica de navegação muda.
  - `Wiz` botão back/close sem role/label (`Wiz.tsx:50`, `:83`).
  - `notifications.tsx:39` "marcar todas" é `<Pressable>` **sem** `accessibilityRole="button"`.
  - `Card onPress` (`Card.tsx:26`) não define `accessibilityRole` — linhas clicáveis (notificações, etc.) não se anunciam como botão.
  - Dot de não-lida (`notifications.tsx:92`) e dots de status (`Badge` `dot`) são **cor-apenas** — o dot de unread não tem texto alternativo. 1.4.1.

### 4.2 Focus ring — só web, e nem sempre
`focusRing` (`a11y.ts:9-13`) retorna outline **apenas** `Platform.OS === 'web'`. Aplicado em `Button`, `Card`, `Chip`, `IconButton`. **Mas** os botões dentro dos sheets, `PickerField`, `BackBar`, `Wiz`, `notifications` "marcar todas" **não** usam `focusRing` → sem indicação de foco no teclado web. 2.4.7/2.4.11 (WCAG 2.2). Reconcilia A11Y-03.

### 4.3 Alvos de toque (2.5.8 — mínimo 24×24; recomendado 44×44)
- `notifications.tsx:39` "marcar todas" — texto 13px com `hitSlop={8}` → ~29px de altura efetiva. Abaixo de 44.
- Botão fechar dos sheets: `Icon size 22` + `hitSlop 8` → ~38px. Aceitável para 2.5.8 (24) mas abaixo do recomendado.
- `IconButton` 40×40 (`primitives.tsx:30`) — ok.
- `navBtn` do DatePicker 30×30 (`DatePicker.tsx:72`) **sem** hitSlop → 30px, e sem role/label. Abaixo do recomendado.
- `Field` mic `hitSlop 8` (`Field.tsx:74`) — ok.

### 4.4 Formulários (3.3.1/4.1.3)
`Field` tem `error` visual (`Field.tsx:88-90`) mas **não** associa erro ao input (`aria-describedby`/`accessibilityLiveRegion` ausentes) nem marca `aria-invalid`. Reconcilia A11Y-04. Além disso, validação real é frequentemente server-side via `Alert.alert` (fora do escopo deste cluster, mas confirma DS-02).

---

## 5. Estados globais

### 5.1 Loading: skeleton vs spinner coexistem sem regra — **Médio (C7)**
- Skeletons existem e são bons: `Skeleton`, `SkeletonCard`, `SkeletonList`, `SkeletonTiles`, `SkeletonScreen` (`Skeleton.tsx`). `PaginatedList` usa `SkeletonList` no loading inicial (`PaginatedList.tsx:103-104`) — ótimo.
- **Mas** telas compostas ainda usam `ActivityIndicator`: provider `dashboard.tsx:141` (`nearby.isLoading ? <ActivityIndicator>`), `PaginatedList` no rodapé de próxima página (`:131-132`, aceitável), `Button loading` (spinner, ok). Não há regra: algumas listas mostram skeleton, outras spinner. Percepção de performance inconsistente.
- **Proposta:** padronizar — skeleton para primeiro carregamento de conteúdo estruturado; spinner só para ações pontuais (footer de paginação, botão). Documentar no DS.

### 5.2 Empty: bom
`EmptyState` (`EmptyState.tsx`) é sólido, com `tone` brand/muted, ícone com halo, CTA opcional, `fill`. Usado corretamente (`notifications.tsx:49`, `dashboard.tsx:139`). Sem ressalvas graves — só o contraste do ícone muted `ink3` (§3).

### 5.3 Error: **sem UI de erro/retry** — **Alto (C5)**
- `PaginatedList` **não trata `isError`** — a interface `InfiniteListQuery` (`PaginatedList.tsx:33-41`) nem expõe `isError`. Se a query falha, mostra lista vazia ou nada; sem card de erro nem botão "tentar de novo". Reconcilia FUNC-01.
- Erros de mutação surgem via `Alert.alert` (DS-02): no web vira `window.alert` sem estilo e bloqueante. Não há `Toast`/`Snackbar` compartilhado (busca por `Toast|Snackbar|ErrorBoundary` em `.tsx` acha **só** `apps/customer/app/ar-medicao.tsx`). **Não há ErrorBoundary global.**
- `api/client.ts:152-156,180-185` já transforma "servidor inalcançável" em `ApiError(0, mensagem amigável localizada)` — bom, mas **ninguém consome o status 0 para um estado offline dedicado**; vira só mais um alert.
- **Proposta:** (a) adicionar `isError`/`error`/`refetch` a `InfiniteListQuery` e renderizar um `<ErrorState onRetry>` (irmão de `EmptyState`); (b) criar `<Toast>` compartilhado + provider; (c) `ErrorBoundary` no root layout de cada app.

### 5.4 OFFLINE: inexistente — **Crítico (C2)**
- **Não há NetInfo em lugar nenhum do código de app.** A dependência `@react-native-community/netinfo` aparece nos `package.json` (transitiva do pusher-js/react-native, ver comentário em `echo.ts:37-38`) mas **nenhum componente a usa**. Busca por `NetInfo|isConnected|useNetInfo` em código: só comentários/deps.
- O "offline" do `dashboard.tsx:99,138` é o **toggle de disponibilidade do prestador** (online/offline como status de trabalho), **não** conectividade de rede. Falso positivo.
- Consequências: **sem banner global "sem conexão"**, sem fila offline de ações (record km, bid, etc. falham com alert), sem revalidação automática ao reconectar, sem badge de estado. Num app de campo (prestador em deslocamento, cliente na rua) isso é grave.
- Reconcilia a lacuna já apontada no digest: **nenhum** relatório antigo cobriu offline — é buraco de cobertura, não item resolvido.
- **Proposta:** hook `useConnectivity()` (NetInfo) no shared + `<OfflineBanner>` global montado no `Screen`/root; integrar com React Query (`onlineManager`) para pausar/retomar; fila opcional para mutações idempotentes.

---

## 6. Notificações / Realtime

### 6.1 Badge "99+" — cap existe, mas ring perpétuo
- `primitives.tsx:98`: `{count > 99 ? '99+' : count}` — cap correto. Bom `includeFontPadding:false`+`lineHeight` (`:96`) para centralizar.
- **Problema de UX:** o `Badge` de contagem tem um **anel pulsante infinito** (`Animated.loop`, `primitives.tsx:51-59`) enquanto houver qualquer não-lida. Um usuário com 12 não-lidas fica com o sino "respirando" para sempre — ruído/ansiedade e consumo de bateria (loop constante mesmo com `useNativeDriver`). Deveria pulsar **na chegada** e parar, não perpetuamente. **Médio.**
- Overload: a lista de notificações (`notifications.tsx`) é paginada e ok; mas não há agrupamento/colapso de tipos repetidos (5 bids viram 5 linhas). **Baixo.**

### 6.2 Deep-link — bem projetado
`notificationLinks.ts` é o melhor arquivo do cluster: mapa **aditivo** de 25+ tipos → rota+ícone (`:20-58`), com fallback gracioso (tipo desconhecido = "app antigo vs server novo", ainda lista/lê, só não navega, `:8-9,63-71`). `notifications.tsx:20-26` marca como lida ao tocar mesmo sem rota. Sem ressalvas.

### 6.3 Chime — sólido, com uma escolha discutível
`useNotificationChime.ts`: rate-limit 4s (`:22,45-46`), `playsInSilentMode:false` (respeita silencioso, `:29`), haptic sempre (`:55`), degradação sem áudio (`:32-34`). Bem pensado. Ressalva menor: `MIN_GAP_MS` global por instância do hook — se dois listeners montarem o hook, o rate-limit não é compartilhado. **Baixo.**

### 6.4 Realtime/echo — robusto, mas com débito
- `echo.ts` tem lazy-require correto por plataforma e desembrulho defensivo de construtor Pusher/Echo (`:49-64`) — comentários extensos revelam que isto custou caro. Funciona.
- `subscribeToUser` (`:214-225`) e `subscribeToRequest` (`:168-191`) OK. `useRealtimeNotifications.ts` trata unsubscribe/cancelled corretamente e é aditivo (`:27-29`).
- **Débito:** `echo.ts` guarda uma **conexão singleton** (`let echo`, `:24`) autenticada com o token capturado **no momento da conexão** (`:66`). Após refresh de token, o socket segue com o antigo até `disconnectRealtime()`. Sem reconexão em troca de token. **Médio.**

### 6.5 Push
`push.ts`/`usePushSync.ts` OK (registro aditivo, cleanup no logout, no-op no web). `setupNotificationHandler` com `shouldSetBadge:false` (`push.ts:52`) — o badge do ícone do app **nunca** é setado; a contagem só vive dentro do app. Decisão consciente, mas o número no ícone do launcher fica sempre zerado. **Baixo.**

---

## 7. Débito técnico de UI

- **StyleSheet ausente:** só `Text.tsx` e `Button.tsx` usam `StyleSheet.create`; ~23 componentes usam **estilos inline** (objetos recriados a cada render). Parcialmente justificável (estilos dependem de `t` em runtime), mas os pedaços **estáticos** (ex.: `styles.row` já extraído no Button) poderiam ser `StyleSheet.create` e só os theme-driven ficarem inline. Custo: alocação por render em listas grandes. **Médio.**
- **Comentário copy-paste com bug de formatação** (dupla quebra de linha) em 6 arquivos de sheet — sintoma de duplicação (§2.2).
- **`focusRing` tipado `any`** (`a11y.ts:9`) — necessário, documentado. Ok.
- **`TestBanner`/`TestBadge`** são temporários e bem sinalizados (`TestBanner.tsx:8-17`, export marcado em `index.ts:30`). Rastreável. Ok.
- **Divergência de `paddingBottom` dos sheets** (24 vs 28) e de `Row gap` (12/13/14) — números mágicos sem token (§1.2).
- **`Toggle` visual-only** e **três `SelectField` reimplementados** (§2.4) — débito de componente.
- **`headWeight` string** por tema — ok, mas primitives às vezes hardcodam `'800'`/`'700'` (`primitives.tsx:162,166,213`) em vez de `t.headWeight`, quebrando o trust theme (que quer 700). **Baixo/Médio.**

---

## 8. Índice de problemas (severidade · file:line · proposta)

| ID | Sev | Problema | file:line | Proposta DS |
|---|---|---|---|---|
| C1 | Crítico | Contraste AA reprovado (accent 2.85, soft 2.54, ok 2.57, ink3 2.59) | `themes.ts:64-72`; `Button.tsx:43,48`; `Text.tsx:26`; `primitives.tsx:162,236` | Escurecer accent / tokens `*Text` escuros; ink3→decorativo |
| C2 | Crítico | Sem detecção offline (NetInfo não usado; sem banner/fila) | app inteiro (0 usos) | `useConnectivity()`+`<OfflineBanner>`+`onlineManager` |
| C3 | Alto | Sheet reimplementado 6× | `DictationModal.tsx:104`; `RequestFilterSheet.tsx:51`; `RecordKmSheet.tsx:63`; `SinglePicker.tsx:43`; `LinkedPicker.tsx:86`; `DatePicker.tsx:88` | Extrair `<Sheet>` (API §2.2) |
| C4 | Alto | Sem escala de spacing (números mágicos) | `themes.ts:44`; `primitives.tsx:125,142,161,174` | `theme.space` 4-pt + `radius.sheet` |
| C5 | Alto | Erro de query sem UI/retry; sem Toast/ErrorBoundary | `PaginatedList.tsx:33-41`; global | `isError` em query + `<ErrorState>` + `<Toast>` + ErrorBoundary |
| C6 | Alto | Tipografia inline fora de `<Text variant>` | `primitives.tsx:129,149,162,213,236`; `Wiz.tsx:53,55,68`; `notifications.tsx:78` | Ampliar `Variant`; lint proibindo fontSize literal |
| A1 | Médio | Loading skeleton vs spinner sem regra | `PaginatedList.tsx:103` vs `dashboard.tsx:141` | Regra documentada skeleton/spinner |
| A2 | Médio | Focus ring só web e incompleto; alvos <44px; labels de ícone em inglês | `a11y.ts:9`; `notifications.tsx:39`; `primitives.tsx:32,143`; `DatePicker.tsx:72` | `focusRing` em todos os Pressable; labels i18n; hitSlop |
| A3 | Médio | Anel pulsante perpétuo no badge do sino | `primitives.tsx:51-59` | Pulsar só na chegada, depois parar |
| A4 | Médio | `Toggle` visual-only (sem switch real/role) | `primitives.tsx:282-289` | `onValueChange`+`role="switch"`+Pressable |
| A5 | Médio | 3× `SelectField` duplicado | `LinkedPicker.tsx:129`; `primitives.tsx:231`; `DatePicker.tsx:80` | Extrair `<SelectField>` |
| A6 | Médio | Realtime não reconecta em troca de token | `echo.ts:24,66` | Reassinar socket no refresh |
| A7 | Médio | Estilos inline (sem StyleSheet) em ~23 comps | `ui/*` | StyleSheet para partes estáticas |
| B1 | Baixo | `headWeight` hardcoded quebra trust theme | `primitives.tsx:162,166,213` | Usar `t.headWeight` |
| B2 | Baixo | `radius.btn` hardcoded como 999 | `Badge.tsx:27`; `Chip.tsx:26`; `SuggPill:295` | Usar `t.radius.btn` |
| B3 | Baixo | Sem badge no ícone do launcher | `push.ts:52` | Avaliar `shouldSetBadge` |
| B4 | Baixo | Sem agrupamento de notificações repetidas | `notifications.tsx` | Colapsar por tipo |

---

## 9. Reconciliação com `audit/` (2026-06-22)

| Achado antigo | Status hoje | Evidência |
|---|---|---|
| A11Y-02 contraste (High) | **Ainda válido e pior que o relatado** — cálculos definitivos: accent 2.85, soft 2.54 (abaixo até de 3:1). Resolve a divergência DESIGN_AUDIT (2.5) vs ACCESSIBILITY (2.85): o correto é ~2.85. | §3 |
| A11Y-01 headings/landmarks (High) | Parcial: `Text` agora expõe `accessibilityRole="header"`+`aria-level` (`Text.tsx:45-49`) — **melhorou**. Landmarks (`<nav>/<main>`) ainda ausentes. | `Text.tsx:45-49` |
| A11Y-03 focus ring (Med) | Parcial: `focusRing` criado (`a11y.ts`) e aplicado em Button/Chip/Card/IconButton — **melhorou**; ainda falta em sheets/PickerField/BackBar/Wiz. | §4.2 |
| A11Y-04 form error assoc. (Med) | **Ainda válido** — `Field` sem aria-describedby/live region. | `Field.tsx:88-90` |
| DS-02 Alert.alert / sem toast (High) | **Ainda válido** — nenhum Toast; ErrorBoundary só em ar-medicao. | §5.3 |
| DS-03 duplicação sheet ×4 (Med) | **Ainda válido e subcontado** — são **6** reimplementações no kit+customer, não 4. | §2.2 |
| FUNC-01 sem error/retry (Med) | **Ainda válido** — `PaginatedList` não expõe `isError`. | `PaginatedList.tsx:33-41` |
| RESP-01 Screen sem maxWidth (High) | **Corrigido** — `Screen`/`PaginatedList` agora capam a `maxWidth: 480` centralizado (`Screen.tsx:66`, `PaginatedList.tsx:91`). | `Screen.tsx:66` |
| Offline/NetInfo | **Buraco de cobertura confirmado** — nunca auditado; hoje inexistente. Elevado a Crítico aqui. | §5.4 |
| Notif/realtime/badge | Sem defeito antigo; aqui identifico anel perpétuo (A3), sem reconexão de token (A6), deep-link OK. | §6 |
| Observação metodológica | Relatórios antigos **não têm file:line** e usavam nomes `@walvee/*`. Este relatório traz file:line reais e nota o rebrand. | topo |
