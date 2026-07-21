# Acessibilidade (WCAG 2.2 AA) — App Customer (Chama Fácil)

**Relatório final** · Especialista WCAG · pt-BR · Data: 2026-07-20
**Método:** revisão de código (`packages/shared/src/ui`, `apps/customer`) + razões de contraste computadas + walkthrough dinâmico no device.
**Fontes:** `ux-audit/_notes/cluster-design-system-global.md`, `dynamic-walkthrough.md`, reconciliado com `audit/ACCESSIBILITY_REPORT.md`.

---

## Veredito

A acessibilidade está **abaixo do mínimo legal (WCAG 2.2 AA)** em três eixos sistêmicos: **contraste** (o CTA primário e todo texto secundário reprovam), **componentes interativos sem semântica** (SlideToConfirm, BudgetMeter, Stars, Toggle não se anunciam a leitores de tela), e **foco de teclado incompleto**. A boa notícia: quase tudo é **correção de alta alavancagem** — arruma-se uma vez em `Text`/`Button`/`Field`/tokens e propaga para todas as telas.

**Score de acessibilidade: 48/100 — Reprovado para AA.** (Piorou vs os 55 estimados em 2026-06-22 porque o cluster expõe falhas de componente antes não medidas.)

---

## 1. Contraste (1.4.3 / 1.4.11) — **Crítico**

Cálculos definitivos (WCAG, tema `sunset` sobre `#ffffff`):

| Par | Uso | Razão | Reprova |
|---|---|---|---|
| white / `accent #ff6a3d` | CTA primário grad/solid | **2.85:1** | AA normal **e** UI 3:1 |
| `accent` / `accentSoft #fff0ea` | botão `soft`, badge open, SuggPill | **2.54:1** | AA normal **e** UI 3:1 |
| white / `ok #12b981` | botão ok, badge live | **2.57:1** | AA normal **e** UI 3:1 |
| `ink3 #95a2b6` / white | caption, placeholder, timestamp | **2.59:1** | AA normal **e** UI 3:1 |
| white / `danger #f0455b` | botão danger | 3.71:1 | AA normal (passa large/UI) |

- CTA `grad` é o botão de maior valor do app (`Button.tsx:43,59`) e reprova até 3:1.
- `ink3` usado como texto legível apesar do próprio comentário admitir a falha (`Text.tsx:25-26`): SectionLabel (`primitives.tsx:162`), FieldDisplay (`:236`), Steps (`:268`), timestamp (`notifications.tsx:87`), placeholder (`Field.tsx:56`).

**Correção:** escurecer `accent` (≥4.5:1 com branco) ou texto ink escuro; tokens `accentText`/`okText` para fundos `*Soft`; ink3 → decorativo, texto migra para ink2.

---

## 2. Componentes interativos inacessíveis — **Alto/Crítico**

### 2.1 `SlideToConfirm` — inacessível (2.1.1 / 4.1.2)
`SlideToConfirm.tsx` usa `PanResponder` (arrastar para confirmar). Não há caminho **alternativo por teclado/leitor de tela** nem `accessibilityRole`/`accessibilityActions`. Usado para **enviar pedido** e **aceitar proposta** (compromisso financeiro — `16→17`). Um usuário de teclado ou VoiceOver/TalkBack **não consegue completar a ação primária do app**. Falha 2.1.1 (Keyboard) e 2.5.7 (Dragging Movements, WCAG 2.2). **Crítico.**
**Correção:** expor `accessibilityRole="button"` + `accessibilityActions=[{name:'activate'}]` com `onAccessibilityAction`, ou oferecer botão "Confirmar" equivalente quando AT/teclado ativo.

### 2.2 `BudgetMeter` — sem valor acessível (1.1.1 / 4.1.2)
`BudgetMeter.tsx` é um medidor visual (value/min/max/band). Sem `accessibilityRole="adjustable"` nem `accessibilityValue`. O leitor de tela não anuncia o valor sugerido nem a posição. Além disso a semântica de cor (vermelho→verde) é sinal-só-por-cor (1.4.1) — o walkthrough marcou isso como confuso (`11-step6.png`). **Alto.**
**Correção:** `accessibilityRole="adjustable"`, `accessibilityValue={{min,max,now}}`, label textual do valor; não depender só de cor para "acima/abaixo do orçamento".

### 2.3 `Stars` — sem semântica e estado "Novo" enganoso (1.1.1 / 4.1.2)
`Stars` não anuncia valor (`accessibilityValue`) nem número de avaliações. Provider novo aparece como "0.0 · 5 estrelas vazias" (`16-proposal-scroll.png`) — leitor de tela e visão anunciam **nota zero** (negativo) quando deveria ser "Novo/Sem avaliações". **Alto.**
**Correção:** `accessibilityLabel="Avaliação 4 de 5 (12 avaliações)"`; quando `count===0`, label="Sem avaliações".

### 2.4 `Toggle` visual-only (4.1.2)
`primitives.tsx:282-289`: sem `Pressable`, sem `onValueChange`, sem `accessibilityRole="switch"`/`accessibilityState.checked`. Não é operável nem anunciável. **Médio.**

---

## 3. Labels em Pressables custom (4.1.2 / 1.1.1) — **Alto**

- `IconButton` usa **o nome do ícone** como label fallback (`accessibilityLabel ?? name`, `primitives.tsx:32`) → o leitor anuncia **"bell", "menu" em inglês técnico** num app pt-BR. Falha 4.1.2.
- `BackBar` botão voltar **sem** `accessibilityRole`/`Label` (`primitives.tsx:143-147`) — ação crítica de navegação.
- `Wiz` back/close sem role/label (`Wiz.tsx:50,83`).
- `notifications.tsx:39` "marcar todas" é `<Pressable>` **sem** `accessibilityRole="button"`.
- `Card onPress` (`Card.tsx:26`) sem `accessibilityRole` — linhas clicáveis (notificações) não se anunciam como botão.
- `SinglePicker`/`LinkedPicker`: botão fechar do sheet **sem** label (`SinglePicker.tsx:52`, `LinkedPicker.tsx:95`), enquanto `RequestFilterSheet.tsx:60` tem — a11y desigual pela duplicação.

**Correção:** labels traduzidas (i18n) em todo `IconButton`/Pressable; `role="button"` nas linhas/ações de texto.

---

## 4. Foco / ordem de tabulação (2.4.7 / 2.4.11) — **Alto**

`focusRing` (`a11y.ts:9-13`) só retorna outline em `Platform.OS==='web'`. Aplicado em `Button`, `Card`, `Chip`, `IconButton`. **Mas** falta em: botões dos sheets, `PickerField`, `BackBar`, `Wiz`, "marcar todas" das notificações → **sem indicação de foco de teclado** nesses controles no web. Falha 2.4.7 e 2.4.11 (Focus Not Obscured, WCAG 2.2). Nenhum controle de `tabIndex`/ordem explícita — a ordem segue o DOM, geralmente OK, mas os sheets renderizam fora do fluxo sem gestão de foco (`accessibilityViewIsModal` ausente).

**Correção:** aplicar `focusRing` a todo Pressable; `accessibilityViewIsModal` + foco inicial nos sheets (resolvido de vez pelo `<Sheet>` proposto).

---

## 5. Alvos de toque (2.5.8 — mín 24×24; recomendado 44×44) — **Médio**

- `notifications.tsx:39` "marcar todas": texto 13px + `hitSlop 8` → ~29px de altura. Abaixo de 44.
- `navBtn` do `DatePicker` 30×30 (`DatePicker.tsx:72`) **sem** hitSlop, sem role/label → 30px.
- Botão fechar dos sheets: `Icon 22` + `hitSlop 8` → ~38px (passa 2.5.8, abaixo do recomendado).
- OK: `IconButton` 40×40, `Field` mic hitSlop 8.

---

## 6. Badge pulsante perpétuo (2.3.3 / 2.2.2) — **Médio**

O `Badge` de contagem do sino tem **anel pulsante infinito** (`Animated.loop`, `primitives.tsx:51-59`) enquanto houver qualquer não-lida. Movimento perpétuo não parável tangencia 2.2.2 (Pause, Stop, Hide) e é ruído/ansiedade + bateria. Deveria pulsar **na chegada** e parar. **Médio.**

---

## 7. Formulários (3.3.1 / 4.1.3) — **Médio**

`Field` tem `error` visual (`Field.tsx:88-90`) mas **não** associa erro ao input (`aria-describedby`/`accessibilityLiveRegion` ausentes) nem marca `aria-invalid`. Validação real é frequentemente server-side via `Alert.alert`. Estado "obrigatório" não anunciado. Falha 3.3.1/3.3.3/4.1.3.
**Runtime relacionado:** etapa 1 do wizard — "Continuar" desabilita silenciosamente com descrição vazia, sem dizer o que falta (`02-step1-continue-empty.png`). Falha 3.3.1 (Error Identification).

---

## 8. Cor como único sinal (1.4.1) — **Médio**

- Dots de status (`Badge dot`) e dot de não-lida (`notifications.tsx:92`) são **cor-apenas**, sem texto/forma alternativa.
- Lista de chamados: "Aceito", "Em atendimento", "Concluído" no **mesmo verde** (`20-requests-list.png`) — impossível diferenciar por cor. Resolve com `<StatusPill>` (cores distintas + label).

---

## 9. Estrutura semântica (1.3.1 / 2.4.1) — **Médio** (melhorou parcial)

`Text` agora expõe `accessibilityRole="header"` + `aria-level` (`Text.tsx:45-49`) — **melhorou** vs A11Y-01. Mas **landmarks** (`<nav>`/`<main>`/`<header>`) continuam ausentes no RN-web → navegação por região indisponível.

---

## Tabela WCAG consolidada

| Critério WCAG | Onde | Severidade | Correção |
|---|---|---|---|
| 1.4.3 Contraste (texto) | accent/ok/ink3 — `Button.tsx:43,48`; `Text.tsx:26` | Crítico | Escurecer accent / tokens `*Text` / ink3→decorativo |
| 1.4.11 Contraste (UI) | soft 2.54, ok 2.57 — `Button.tsx:48` | Crítico | Idem |
| 2.1.1 / 2.5.7 Teclado / arrasto | `SlideToConfirm.tsx` (enviar/aceitar) | Crítico | `accessibilityActions` + alternativa por botão |
| 4.1.2 Nome/função/valor | `IconButton` label EN (`primitives.tsx:32`); `Toggle`; `BudgetMeter`; `Stars` | Alto | Labels i18n; roles switch/adjustable; `accessibilityValue` |
| 2.4.7 Foco visível | sheets/PickerField/BackBar/Wiz — `a11y.ts:9` | Alto | `focusRing` em todo Pressable |
| 2.4.11 Foco não obscurecido | sheets sem `accessibilityViewIsModal` | Alto | `<Sheet>` com gestão de foco |
| 1.1.1 Conteúdo não textual | `Stars` (0.0), dots cor-só | Alto | Texto alternativo; estado "Novo" |
| 3.3.1 Identificação de erro | `Field` (`:88`); wizard step1 (`02-*.png`) | Médio | Associar erro; mensagem do que falta |
| 4.1.3 Mensagens de status | `Field` sem live region; `Alert.alert` | Médio | `accessibilityLiveRegion`; Toast como live region |
| 2.5.8 Tamanho de alvo | "marcar todas" (`notifications.tsx:39`); navBtn (`DatePicker.tsx:72`) | Médio | hitSlop / min 44dp |
| 1.4.1 Uso de cor | status dots; lista verde-única (`20-*.png`) | Médio | `<StatusPill>` + texto/forma |
| 2.2.2 Pausar movimento | badge pulsante (`primitives.tsx:51-59`) | Médio | Pulsar na chegada e parar |
| 1.3.1 / 2.4.1 Info/landmarks | RN-web sem `<nav>/<main>` | Médio | Landmark roles em Screen/AppBar/TabBar |

---

## Tabela de melhorias por prioridade

| Problema | Impacto | Solução | Justificativa | Esforço | Prioridade |
|---|---|---|---|---|---|
| Contraste AA reprovado (CTA + texto) | Legibilidade + risco legal em 100% das telas | Escurecer accent / tokens `*Text` / ink3→decorativo | Correção 1× nos tokens propaga | M | **Crítica** |
| `SlideToConfirm` sem teclado/AT | Bloqueia a ação primária (enviar/aceitar) p/ AT | `accessibilityActions` + botão alternativo | 2.1.1/2.5.7 são bloqueadores | M | **Crítica** |
| IconButton/BudgetMeter/Stars/Toggle sem semântica | Controles mudos p/ leitor de tela | roles + `accessibilityValue` + labels i18n | Múltiplos 4.1.2 | M | **Alta** |
| Foco visível incompleto | Usuário de teclado se perde | `focusRing` universal + foco em sheets | Web é alvo real | M | **Alta** |
| Labels de ícone em inglês | Anúncio "bell/menu" em app pt-BR | i18n no fallback do `IconButton` | Quebra imersão + correção | P | **Alta** |
| Alvos <44dp | Toques falham (mão trêmula, mobilidade) | hitSlop / min height | Wizard urgente + campo | P | Média |
| Badge pulsante perpétuo | Ansiedade/bateria; tangencia 2.2.2 | Pulsar na chegada e parar | Movimento não parável | P | Média |
| Cor como único sinal (status) | Daltonismo não diferencia status | `<StatusPill>` cor+label distintos | Verde-único confirmado | M | Média |
| Erro de form não associado | Leitor não sabe o erro; wizard mudo | `aria-describedby`+live region; msg no step1 | 3.3.1/4.1.3 | M | Média |
| Landmarks ausentes | Sem navegação por região no web | roles landmark nos containers | Melhora parcial já feita | M | Baixa |

---

## Score de acessibilidade

| Eixo | Nota |
|---|---|
| Contraste | 25 |
| Semântica de componentes interativos | 35 |
| Foco/teclado | 45 |
| Labels/nomes | 50 |
| Alvos de toque | 65 |
| Formulários | 45 |
| Estrutura/landmarks | 55 |
| **Total** | **48/100 — Reprovado para WCAG 2.2 AA** |

**Veredito:** não conforme AA hoje. Porém as falhas são majoritariamente **sistêmicas e de alta alavancagem** — corrigir tokens de contraste, adicionar semântica em ~5 componentes compartilhados e universalizar o `focusRing` levaria o score para a faixa de aprovação sem tocar tela por tela.
