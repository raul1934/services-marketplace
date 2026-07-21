# Relatório de Consistência — App Customer (Chama Fácil)

**Escopo:** inconsistências entre telas e componentes que quebram a percepção de um sistema único.
**Base:** walkthrough dinâmico no device + 4 relatórios de cluster. Evidências em `ux-audit/screens/NN-*.png`.
**Data:** 2026-07-20 · Idioma: pt-BR
Severidade: **Crítico / Alto / Médio / Baixo** · Esforço: **P / M / G**.

> Diagnóstico geral: o app tem um Design System com tokens fortes (cores, radius, gradientes), mas **muitos componentes furam a escala** (tipografia inline, spacing mágico) e **formatadores divergem entre superfícies** (moeda, tempo). O resultado é que a mesma informação (preço, ETA, status, ação de aceite) aparece de formas diferentes dependendo de onde o usuário está.

---

## Tabela consolidada

| # | Inconsistência | Onde (telas / arquivos) | Impacto | Padrão único proposto |
|---|---|---|---|---|
| 1 | **Dois mecanismos de aceite** na MESMA tela: 1ª proposta usa "Arraste para aceitar" (`SlideToConfirm`); demais usam botão "Aceitar proposta" (tap) | `16-proposal-scroll.png`; `ProposalsList.tsx:382` | **Alto** — mesma ação, dois modelos mentais; confunde e adiciona bloqueio de a11y (arrasto sem alternativa) | Um único controle de aceite para todas as propostas — botão primário com confirmação, OU slide com alternativa de toque; nunca os dois lado a lado |
| 2 | **Moeda quebrada**: propostas mostram "R$ 103.2" / "R$ 115.2" (ponto en-US, sem centavos); Solicitação e notificações mostram "R$ 120,00" / "R$ 103,20" | `16`,`15` vs `14-req-solicitacao.png`,`23-notifications.png`; formatter do card de proposta | **Alto** — parece bug/erro de valor num contexto financeiro; mina confiança | `formatBRL(value)` único (pt-BR, sempre 2 casas, vírgula decimal) consumido por TODAS as superfícies de preço |
| 3 | **ETA em 3 formatos**: card de proposta "1h4" (truncado, sem "min"); notificações "64 min"; rastreio "~16 min" | `16`,`23`,`17-accepted.png` | **Médio** — usuário não sabe se são o mesmo dado; "1h4" é ilegível | `formatEta(minutes)` único: "~16 min" / "1 h 4 min", mesma regra em todas as telas |
| 4 | **i18n misturado (pt/en)**: notificação "New question from a pro" convive com "Nova proposta recebida"; perguntas do QnA em inglês ("What's the make and model of the vehicle?") num app pt-BR | `23`,`16`; string hardcoded do app | **Alto** — quebra de idioma visível ao usuário final; parece produto inacabado | Todas as strings via i18n pt-BR; nenhuma string hardcoded em inglês; QnA seed traduzido |
| 5 | **Status todos verdes** na lista: "Aceito", "Em atendimento" e "Concluído" usam o mesmo verde | `20-requests-list.png`; `RequestCard.tsx:56` | **Médio** — impossível distinguir ativo de concluído num relance | Paleta de status distinta (ativo = accent/azul, concluído = verde/muted, cancelado = danger), com badge + texto |
| 6 | **Pluralização preguiçosa "(s)"**: "5 proposta(s)", "0 foto(s)", "1 proposta(s)" — o "(s)" literal na UI | `20`,`12-step7.png` | **Baixo** — parece amador; "1 proposta(s)" é gramaticalmente errado | Helper `plural(n, sing, plur)` ou ICU MessageFormat: "1 proposta" / "5 propostas" / "nenhuma foto" |
| 7 | **Tipografia inline vs variantes `<Text>`**: primitives usam `fontSize`/`fontWeight` cru (`19`, `12.5`, `13.5`, `14.5`, `26`) em vez de `<Text variant>` | `primitives.tsx:129,149,162,213,236`; `Wiz.tsx:53,55,68`; `notifications.tsx:78` | **Alto** — drift tipográfico; tamanhos fracionários improváveis de reuso; escala não é fonte única | Ampliar `Variant` em `Text.tsx` (h3/title/overline); proibir `fontSize` literal fora de `Text.tsx` (lint) |
| 8 | **6 bottom-sheets duplicados**: cada um reimplementa Modal+backdrop+grab handle+insets; comentário copy-paste verbatim em 6 arquivos | `DictationModal.tsx:104`; `RequestFilterSheet.tsx:51`; `RecordKmSheet.tsx:63`; `SinglePicker.tsx:43`; `LinkedPicker.tsx:86`; `DatePicker.tsx:88` | **Alto** — divergências já introduzidas (paddingBottom 24 vs 28; a11y do botão fechar desigual; affordance mentirosa — grab handle sem arrasto) | Extrair `<Sheet>` compartilhado (`packages/shared/src/ui/Sheet.tsx`) com header/close acessível, insets e radius padronizados |
| 9 | **Placeholder-como-label**: campos sem label persistente; ao digitar, o rótulo some; placeholder em `ink3` (~2.6:1) | `AuthField.tsx:35`; `Field.tsx:56`; login/register | **Crítico** — falha WCAG 1.4.3/3.3.2; usuário perde o contexto do campo ao digitar | Label persistente acima do campo em todos os inputs; placeholder só como exemplo, nunca como rótulo |
| 10 | **Card gradiente CTA duplicado**: "Precisa de ajuda agora?" e `FirstAssetCard` são quase idênticos (Pressable → LinearGradient → texto flex + caixa 46×46) | `home.tsx:182-197`; `HomeAssets.tsx:154-174` | **Médio** — duas implementações do mesmo padrão; divergem com o tempo | `<GradientCTACard title body icon onPress/>` compartilhado |
| 11 | **Feedback de sucesso inconsistente nas exceções**: surcharge e no-show-"esperar" dão `router.back()` mudo; requote e dispute dão `Alert.alert` | `surcharge.tsx:31`; `no-show.tsx:44` vs `requote.tsx:31-34`; `dispute.tsx` | **Médio** — em algumas ações o usuário não sabe se deu certo | `SuccessSplash`/toast único para todo sucesso; nunca `router.back()` silencioso |
| 12 | **Três superfícies para avaliar**: modal que reabre a foco + CTA inline no footer + rota dedicada `/rate` | `index.tsx:577-593`; `rate.tsx`; footer `index.tsx:288` | **Médio** — risco de avaliar duas vezes / "já avaliei?" | Uma superfície canônica; rota só como destino de notificação; eliminar o modal renascente OU o CTA inline |
| 13 | **Endereço/geocode inconsistente entre etapas**: etapa 2 "5, Jardim Marajó"; revisão e detalhe "Rua Patrícia Rodrigues Fontes, 805, Jardim Marajó" | `07-step2-location.png` vs `12`,`14` | **Médio** — usuário duvida se o endereço certo foi capturado | Uma fonte de verdade de endereço (mesmo reverse-geocode), exibida igual em todas as telas |
| 14 | **Provider novo como "0.0 · 0 serviços"** com 5 estrelas vazias — parece nota zero (negativa) | `16` | **Médio** — penaliza visualmente prestador sem histórico; confunde o cliente | Estado "Novo" / "Sem avaliações ainda" em vez de "0.0"; ocultar estrelas vazias |
| 15 | **Ordenação (Preço/Tempo/Nota) visível com 0 propostas** | `13-submitted.png` | **Baixo** — controle inútil/ruído no estado vazio | Esconder ordenação até haver ≥1 proposta |
| 16 | **Padrão de exceção fragmentado**: 6 telas de exceção com 2 padrões repetidos (Grupo A decisão / Grupo B abrir caso); dispute deixa remover foto, warranty também, mas dispute **não** deixa remover | `surcharge/requote/reschedule/no-show/dispute/warranty.tsx`; `dispute.tsx:73` vs `warranty.tsx:131` | **Médio** — mesma tarefa, telas e comportamentos diferentes | Grupo A → sheet inline (reusa `CounterOfferSheet`); Grupo B → `ClaimForm` parametrizado único |
| 17 | **`radius.btn` hardcoded como 999** em vez de token; quebra no tema "trust" (que quer 12) | `Badge.tsx:27`; `Chip.tsx:26`; `SuggPill:295` | **Baixo** — inconsistência de forma se o tema mudar | Consumir `t.radius.btn` em todos os pills |
| 18 | **`headWeight` hardcoded** ('800'/'700') em vez de `t.headWeight` — quebra o peso do tema trust | `primitives.tsx:162,166,213` | **Baixo** — peso tipográfico diverge por tema | Consumir `t.headWeight` |
| 19 | **Spacing sem token**: `Row gap` é 13 no default mas 12/14/16 em várias telas; `paddingBottom` 24 vs 28 nos sheets | `primitives.tsx:174` vs `notifications.tsx:64`; sheets | **Alto** — sem fonte única de espaçamento; drift visível | Escala `theme.space` 4-pt; migrar Row/Screen/Card |
| 20 | **Loading: skeleton vs spinner** sem regra: algumas listas usam `SkeletonList`, outras `ActivityIndicator` | `PaginatedList.tsx:103` vs `dashboard.tsx:141` | **Médio** — percepção de performance inconsistente | Skeleton para 1º carregamento estruturado; spinner só para ações pontuais (footer/botão) |
| 21 | **Labels de ícone em inglês técnico**: `IconButton` usa o nome do ícone como fallback → TalkBack lê "bell", "menu" | `primitives.tsx:32` | **Médio** — leitor de tela anuncia em inglês num app pt-BR | `accessibilityLabel` i18n obrigatório em ícones acionáveis |
| 22 | **CTA primário com contraste reprovado** (accent 2.85:1) usado em todo o app | `Button.tsx:43`; `themes.ts:64-72` | **Crítico** — reprova WCAG 1.4.3 sistemicamente | Escurecer `accent` (ex. `#d94a1f`) ou usar `ink` no texto; recomputar `accentInk` |
| 23 | **Default de `mode` diverge dev/prod** no login (email em dev, phone em prod) | `login.tsx:17` | **Baixo** — dev testa um caminho, usuário vê outro | Igualar default entre ambientes (ou documentar) |
| 24 | **`Toggle` visual-only** (sem `onValueChange`/role de switch) coexiste com Pressable externo que faz o estado real | `primitives.tsx:282-289`; `new.tsx:296-305` | **Médio** — "mentira de componente"; comportamento de switch reimplementado a cada uso | `Toggle` real com `onValueChange` + `accessibilityRole="switch"` |

---

## Agrupamento por natureza da inconsistência

**Formatação de dados (o mesmo valor, formatos diferentes):** #2 moeda, #3 ETA, #6 pluralização, #13 endereço, #14 "0.0".
→ Todas resolvidas por **formatters compartilhados** (`formatBRL`, `formatEta`, `plural`, geocode único). São correções P de alto impacto (ver `quick-wins.md`).

**Padrões de interação divergentes (a mesma ação, controles diferentes):** #1 aceite, #11 feedback de sucesso, #12 avaliação, #16 exceções.
→ Resolvidas por **canonicalização de fluxo** (um mecanismo de aceite; feedback uniforme; uma superfície por tarefa).

**Sistema de design furado (componentes que não usam os tokens):** #7 tipografia, #8 sheets, #10 card CTA, #17 radius, #18 headWeight, #19 spacing, #24 Toggle.
→ Resolvidas por **primitivos compartilhados e escala de tokens** (`<Sheet>`, `<GradientCTACard>`, `theme.space`, `<Text variant>`).

**Idioma / conteúdo:** #4 i18n misturado, #21 labels de ícone.
→ Resolvidas por **cobertura i18n completa** e proibição de strings hardcoded.

**Acessibilidade transversal:** #9 placeholder-label, #22 contraste.
→ Críticas; resolvidas no `AuthField`/`Field` central e no token `accent`.

O maior ganho de consistência com menor esforço está no primeiro grupo (formatters): uma única função de moeda e uma de ETA eliminam #2, #3 e parte de #14 imediatamente, e são as inconsistências mais visíveis ao usuário no caminho feliz.
