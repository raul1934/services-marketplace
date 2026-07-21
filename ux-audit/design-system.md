# Design System — App Customer (Chama Fácil)

**Relatório final** · Design System Architect + WCAG 2.2 · pt-BR · Data: 2026-07-20
**Escopo:** `frontend/packages/shared/src/ui` + `.../theme` consumido pelo app Customer (`apps/customer`).
**Fontes:** `ux-audit/_notes/cluster-design-system-global.md`, `dynamic-walkthrough.md`, reconciliados com `audit/` (2026-06-22).

> **Nota de marca.** A auditoria antiga (`audit/`, 2026-06-22) usava `@walvee/shared` / `walvee-ui.css`. O código atual é `@chamafacil/shared` / `chamafacil-ui.css` (`themes.ts:1-2`). O rebrand **walvee → chamafacil** portou os tokens **1:1** (accent `#ff6a3d`, ink3 `#95a2b6`, radius 22/999/16 batem exatamente), então todas as constatações de contraste/token antigas continuam válidas.

---

## Veredito rápido

O DS tem uma **fundação de tokens de cor/tipografia/radius/shadow excelente** (port fiel, tipado, 3 temas) mas para aí. Falta a camada de **espaçamento** (nenhum token de spacing → números mágicos com drift real), faltam **componentes-chave** (`<Sheet>` reimplementado 6×, sem `<GradientCTACard>`, `<StatusPill>` proper), e a paleta **reprova WCAG AA sistemicamente** nos pares mais usados (o CTA primário do app inteiro). É um sistema "bonito no Figma, furado no detalhe".

**Score do DS: 58/100 — Precisa de trabalho.**

---

## 1. Tokens

### 1.1 O que existe e está OK

`Theme` (`themes.ts:18-50`) é tipado e completo em:
- **Cores:** `bg, surface, surface2, ink/ink2/ink3, line/line2, accent/accent2/accentInk/accentSoft, ok/okSoft, danger/dangerSoft, warn, statusbarInk`.
- **Radius:** `{ card: 22, btn: 999, field: 16 }` (`themes.ts:44`).
- **Shadow:** `shadow`/`shadowSm` (`themes.ts:45-46`).
- **Gradientes:** `grad` / `gradSoft`.
- **Fontes:** `font.body/head/mono` + `headWeight`.
- **3 temas:** `sunset`, `trust`, `night` (`themes.ts:52-146`).

Fidelidade de token confirmada 1:1 vs protótipo (`COMPONENT_INVENTORY.md:5-20`). **É o ponto forte do sistema.**

### 1.2 FALTA: escala de spacing — **Alto**

Não existe **nenhum** token de spacing. `themes.ts:44` define `radius` mas nada de `space`/`gap`. Busca por `spacing`/`gap:` em `theme/` retorna **0 ocorrências**. Consequência: números mágicos hardcoded em cada componente.

**Drift real observado** (não é teoria):
- `gap` de "linha" é `13` no `Row` (`primitives.tsx:174`, o default!) mas `12` em `notifications.tsx:64`, e `10`/`14`/`16` em outros lugares. Sem fonte única.
- Amostra só em `primitives.tsx`: `gap:12` (`:125`), `gap:6` (`:142`), `gap:8` (`:161`), `padding:18` (Card `:17`), `paddingHorizontal:20/16`, `paddingVertical:9` (Chip).
- Sheets divergem: `paddingBottom: 28 + insets.bottom` (`DatePicker.tsx:92`) vs `24 + insets.bottom` (`SinglePicker.tsx:47`).
- Radius de sheet é `borderTopLeftRadius: 26` cru em 6 arquivos, sem token `radius.sheet`.

### 1.3 Tipografia — escala não é token (mas centralizada)

A escala vive hardcoded dentro de `Text.tsx:19-28` (h1 28, h2 22, h3 17, body 15, label 13, caption 12, mono 14). Não há `t.type.*`. **Aceitável** porque centralizado em `<Text>` — **desde que todos usem `<Text variant>`**, o que não acontece (ver §2.3). `manropeFor()` (`fonts.ts:17-24`) mapeia peso→família corretamente.

### 1.4 Radius/shadow — OK com ressalva

`radius.btn: 999` é pill total no sunset/night mas `12` no trust (`themes.ts:109`). OK como decisão de marca. Porém componentes hardcodam `borderRadius: 999` (`Badge.tsx:27`, `Chip.tsx:26`, `SuggPill:295`) em vez de `t.radius.btn` — se o trust theme for aplicado, ficam inconsistentes com os botões. **Baixo.**

---

## 2. Componentes (catálogo + duplicações)

### 2.1 Catálogo do UI kit (`packages/shared/src/ui`)

`Text`, `Icon` (+ `IconButton`, `AvatarGrad`, `AppBar`, `BackBar`, `SectionLabel`, `Row`, `CatIc`, `CatTile`, `Price`, `AvInit`, `FieldDisplay`, `Steps`, `Toggle`, `SuggPill` em `primitives.tsx`), `Button`, `Card`, `Badge`, `Chip`, `Field`, `Segment`, `PaymentSelector`, `DynamicFields`, `AnswerList`, `QnaThread`, `Avatar`, `Stars`, `Screen`, `SlideToConfirm`, `SuccessSplash`, `BudgetMeter`, `Wiz`, `AppDrawer`, `EmptyState`, `NotFoundView`, `DictationModal`, `PaginatedList`, `Skeleton` (+ `SkeletonCard/List/Tiles/Screen`), `UpdateBanner`, `TestBanner`/`TestBadge`, `MiniMap`, auth (`AuthField`, `BrandMark`, `DividerOr`, `GoogleButton`, `OtpInput`).

### 2.2 FALTA `<Sheet>` — reimplementado 6× — **Alto**

Seis componentes reimplementam o **mesmo** bottom-sheet (Modal transparente + backdrop `rgba(0,0,0,0.45)` + `justifyContent:'flex-end'` + Pressable de fundo + Pressable interno com stopPropagation + grab handle `40×5` + `borderTopLeftRadius:26` + `paddingBottom: 24|28 + insets.bottom`):

| Arquivo | Bloco Modal | Handle |
|---|---|---|
| `DictationModal.tsx` | `104-110` | `:110` |
| `RequestFilterSheet.tsx` | `51-57` | `:57` |
| `RecordKmSheet.tsx` | `63-69` | `:69` |
| `SinglePicker.tsx` | `43-49` | `:49` |
| `LinkedPicker.tsx` | `86-92` | `:92` |
| `DatePicker.tsx` | `88-94` | `:94` |

**Prova de copy-paste:** o comentário `// Modals render outside the screen's SafeAreaView, so the sheet has to // clear Android's navigation bar itself.` aparece **verbatim, com a mesma quebra dupla esquisita**, nos 6 arquivos. A busca por `<Modal` em `apps/` retorna **15 arquivos**.

**Divergências já introduzidas pela duplicação (bugs de consistência):**
- `paddingBottom`: 28 em Filter/RecordKm/Date/Dictation vs 24 em Single/Linked.
- `SinglePicker`/`LinkedPicker` **não têm** `accessibilityLabel` no botão fechar (`SinglePicker.tsx:52`, `LinkedPicker.tsx:95`) enquanto `RequestFilterSheet.tsx:60` tem. A11y desigual.
- Nenhum implementa arrastar-para-fechar nem slide (todos `animationType="fade"`) apesar do grab handle sugerir arrasto — **affordance mentirosa**.

Isto **amplia** DS-03 (que contava 4 sheets): o real é **6**.

### 2.3 Tipografia inline nos primitives — **Alto**

Vários primitives **não** usam `<Text variant>` e sim `fontSize`/`fontWeight` cru, furando a escala:
- `primitives.tsx`: AppBar sub `fontSize:13` (`:129`), title `fontSize:26` (`:131`); BackBar title `fontSize:19` (`:149`); SectionLabel `fontSize:12,fontWeight:'800'` (`:162`); Price `fontSize:13` (`:213`); FieldDisplay label `fontSize:12` (`:236`).
- `Wiz.tsx`: cat `19` (`:53`), ETAPA `12.5` (`:55`), title `23` (`:68`), sub `13.5` (`:69`).
- `notifications.tsx:78`: título de linha `fontSize:14.5`.

Fontsizes fracionários (`12.5`, `13.5`, `14.5`, `11.5`) são sintoma clássico de ausência de escala.

### 2.4 Componentes divergentes

- **3× `SelectField` reimplementado:** `PickerField` (`LinkedPicker.tsx:129-146`), `FieldDisplay` (`primitives.tsx:231`) e trigger do `DatePicker` (`DatePicker.tsx:80-86`) são três cópias do mesmo "campo clicável" (surface2 + border 1.5 + radius.field + minHeight 50 + ícone à direita). **Médio.** Extrair `<SelectField>`.
- **`Toggle` visual-only:** `primitives.tsx:282-289` é puramente visual (`{ on: boolean }`, sem `onValueChange`, sem Pressable, sem `role="switch"`). É uma mentira de componente. **Médio.**
- **Dois `Badge` colidindo:** `Badge` exportado (pílula de status por `tone`) e `Badge` interno de contagem (`primitives.tsx:43-103`, dot de não-lidas). Nomes conceitualmente colidem.
- **FALTA `<GradientCTACard>`:** o card "Precisa de ajuda agora?" (Home) e outros CTAs de destaque em gradiente são montados à mão por tela, sempre com `#fff` sobre `grad` (o par reprovado 2.85:1). Um componente único centralizaria a correção de contraste. **Médio.**

---

## 3. Cores / Contraste (WCAG 2.2) — **Crítico**

Cálculos definitivos (fórmula WCAG, tema `sunset` sobre `surface #ffffff`):

| Par | Uso | Razão | AA normal (4.5) | AA UI/large (3.0) |
|---|---|---|---|---|
| white / `accent #ff6a3d` | **CTA primário (grad/solid)** | **2.85:1** | ❌ | ❌ |
| `accent` / `accentSoft #fff0ea` | botão `soft`, badge `open`, SuggPill | **2.54:1** | ❌ | ❌ |
| white / `ok #12b981` | botão `ok`, badge live | **2.57:1** | ❌ | ❌ |
| `ink3 #95a2b6` / white | caption, placeholder, timestamps | **2.59:1** | ❌ | ❌ |
| white / `danger #f0455b` | botão `danger` (usa dangerSoft) | 3.71:1 | ❌ | ✅ |
| `ink2 #5b6b82` / white | texto secundário | ~5.4:1 | ✅ | ✅ |

**Pontos críticos:**
- **CTA primário 2.85:1** — o botão `grad` (o mais importante do app) tem texto branco 16px/700 sobre laranja: falha AA e falha até o limiar de 3:1. `Button.tsx:43,59`.
- **Botão `soft` 2.54:1** (`Button.tsx:48`) — pior ainda, falha inclusive UI 3:1.
- **`ink3` como texto legível** — o próprio comentário admite (`Text.tsx:25-26`: "ink3 (~2.6:1) did not [meet AA]") mas o código usa ink3 como texto assim mesmo em SectionLabel (`primitives.tsx:162`), FieldDisplay label (`:236`), Steps número (`:268`), timestamp (`notifications.tsx:87`), placeholder (`Field.tsx:56`). Reprova 1.4.3.
- **28 hex literais fora do token** em `ui/` (dominante `#fff` sobre gradiente = o par 2.85:1).

**Proposta:**
1. Escurecer `accent` para ≥4.5:1 com branco (ex.: `#d94a1f`) **ou** trocar o texto do CTA para `ink` escuro.
2. Adicionar tokens `accentText`/`okText`/`dangerText` (versões escuras) para fundos `*Soft`; proibir `accent` como texto sobre `accentSoft`.
3. Reclassificar `ink3` como **decorativo apenas**; migrar texto ink3→ink2 (uma mudança em `Text.tsx:26` cobre `caption`).

---

## 4. Ícones / Fontes — OK

- **Ícones:** migrados para `lucide-react-native` (`Icon.tsx`), com fallback de busca. Cobertura completa; glyph drift leve vs protótipo é trade-off aceitável (VIS-02). OK.
- **Fontes:** Manrope (`body`/`head`) + Space Mono (`mono`), via `@expo-google-fonts`. `manropeFor()` mapeia peso→família por faixa corretamente. Ressalva menor: FOUT no web (`_layout` retorna null até carregar — TYPO-01, Baixo). OK.

---

## 5. Inconsistências (resumo)

- Drift de spacing (§1.2) — números mágicos sem fonte única.
- Tipografia inline (§2.3) — fontSize cru fora de `<Text>`.
- `headWeight` hardcoded `'800'`/`'700'` (`primitives.tsx:162,166,213`) em vez de `t.headWeight` → quebra o trust theme (que quer 700). **Baixo/Médio.**
- Estilos inline (sem `StyleSheet.create`) em ~23 componentes — só `Text.tsx`/`Button.tsx` usam. Custo de alocação por render em listas. **Médio.**
- **Runtime (walkthrough):** `Price` da proposta renderiza `R$ 103.2` (ponto en-US, sem centavos) enquanto outras superfícies mostram `R$ 103,20` — formatter divergente (`15-cancel-confirm.png`, `16-proposal-scroll.png` vs `14-req-solicitacao.png`). **Alto.** Justifica um `<Price>` único (§7).
- **Runtime:** i18n misturado — "New question from a pro" em inglês convivendo com pt-BR nas notificações (`23-notifications.png`). **Alto.**

---

## 6. Tabela de problemas por severidade

| Problema | Impacto | Solução | Justificativa | Esforço | Prioridade |
|---|---|---|---|---|---|
| Contraste AA reprovado (accent 2.85, soft 2.54, ok 2.57, ink3 2.59) | Legibilidade do CTA principal e de todo texto secundário; falha legal WCAG | Escurecer accent ou texto ink; tokens `*Text`; ink3→decorativo | Afeta 100% das telas; é o CTA de maior valor | M | **Crítica** |
| Sem escala de spacing (números mágicos + drift) | Inconsistência visual, refatoração de tema impossível de fazer 1×; drift já ativo | `theme.space` 4-pt + `radius.sheet`; migrar Row/Card/Screen | Drift real medido (gap 12/13/14) | M | **Alta** |
| `<Sheet>` reimplementado 6× | 6 lugares p/ corrigir bug/a11y; affordance mentirosa; a11y desigual | Extrair `<Sheet>` (API §7) | Copy-paste verbatim comprovado | M | **Alta** |
| Tipografia inline fora de `<Text variant>` | Drift tipográfico; escala não é fonte de verdade | Ampliar `Variant`; lint proibindo fontSize literal | Fontsizes fracionários espalhados | M | **Alta** |
| Falta `<Price>` unificado (formatter pt-BR) | Bug de moeda `R$ 103.2` em produção | `<Price>` com `Intl`/formatter central | Bug confirmado em runtime | P | **Alta** |
| 3× `SelectField` duplicado | Manutenção triplicada de input-display | Extrair `<SelectField>` | 3 cópias idênticas | M | Média |
| `Toggle` visual-only (sem switch real/role) | Componente enganoso; força wrapper externo | `onValueChange` + `role="switch"` + Pressable | Sem interatividade nem a11y | P | Média |
| Falta `<GradientCTACard>` + `<StatusPill>` | CTAs e status montados à mão → drift + contraste | Criar componentes com contraste correto embutido | Centraliza correção de cor | M | Média |
| Estilos inline sem StyleSheet (~23 comps) | Alocação por render em listas | `StyleSheet.create` p/ partes estáticas | Custo de performance | M | Baixa |
| `headWeight`/`radius.btn` hardcoded | Quebra trust theme | Usar `t.headWeight` / `t.radius.btn` | Multi-tema inconsistente | P | Baixa |

---

## 7. Evolução do Design System (proposta de API)

### 7.1 `<Sheet>` — unifica os 6 bottom-sheets
```ts
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;            // header padrão (h3 + botão fechar acessível)
  children: React.ReactNode;
  maxHeightPct?: number;     // default 85
  showHandle?: boolean;      // default true
  dismissable?: boolean;     // backdrop/botão fecham? default true
}
// Encapsula: Modal transparent, backdrop rgba, insets.bottom, radius.sheet,
// grab handle, accessibilityViewIsModal, foco inicial, botão fechar com
// accessibilityLabel padronizado e (evolução) pan-to-dismiss + slide.
```

### 7.2 Tokens de spacing (escala 4-pt)
```ts
// themes.ts — adicionar ao interface Theme e aos 3 temas
space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 };
radius: { card: 22, btn: 999, field: 16, sheet: 26 }; // +sheet
```
Migrar `Row`/`Screen`/`Card`/sheets para consumir `t.space.*`. Ganho: consistência mensurável e refatoração única.

### 7.3 `<StatusPill>` — cores por status
```ts
type Status = 'open' | 'accepted' | 'in_progress' | 'done' | 'cancelled';
interface StatusPillProps { status: Status; label?: string; }
// Mapa status→{bg, fg} com contraste AA garantido. Resolve o bug do
// walkthrough: "Aceito", "Em atendimento" e "Concluído" hoje usam o MESMO
// verde (20-requests-list.png) — impossível diferenciar ativo de concluído.
// accepted=azul, in_progress=âmbar, done=verde, cancelled=cinza.
```

### 7.4 `<Price>` — formatter pt-BR
```ts
interface PriceProps { cents: number; size?: 'sm'|'md'|'lg'; }
// Formata SEMPRE via Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})
// → "R$ 103,20". Corrige o bug "R$ 103.2" do card de proposta
// (16-proposal-scroll.png). Um único ponto de formatação monetária.
```

### 7.5 `<Stars>` acessível
```ts
interface StarsProps {
  value: number; count?: number;        // nº de avaliações
  editable?: boolean; onChange?: (v:number)=>void;
}
// - accessibilityRole="adjustable" (ou "button" por estrela se editável)
// - accessibilityLabel="Avaliação: 4 de 5 estrelas (12 avaliações)"
// - accessibilityValue={{min:0,max:5,now:value}}
// - Estado "Novo" quando count===0 (hoje mostra "0.0 · 5 estrelas vazias",
//   parece nota zero — 16-proposal-scroll.png). Nunca depender só de cor.
```

---

## Score do Design System

| Dimensão | Nota | Comentário |
|---|---|---|
| Tokens de cor/tipo/radius/shadow | 85 | Port fiel 1:1, tipado, 3 temas |
| Escala de spacing | 20 | Inexistente; drift ativo |
| Catálogo de componentes | 65 | Bom, mas Sheet/Price/StatusPill/SelectField faltam |
| Contraste (WCAG AA) | 30 | CTA e texto secundário reprovam sistemicamente |
| Consistência de uso | 55 | Tipografia inline, hex crus, headWeight hardcoded |
| **Total ponderado** | **58/100** | **Fundação forte, execução furada** |
