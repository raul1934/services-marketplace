# Débito Técnico que Afeta UX — App Customer (Chama Fácil)

**Escopo:** débito técnico de UI/arquitetura de front-end que degrada a experiência do usuário (não débito interno invisível).
**Base:** cluster design-system-global + demais clusters + walkthrough dinâmico.
**Data:** 2026-07-20 · Idioma: pt-BR
Risco descrito em termos de **impacto no usuário**. Esforço: **P / M / G**. Prioridade: **Crítica / Alta / Média / Baixa**.

> Contexto: os tokens do tema são fortes, mas faltam **primitivos e infraestrutura de estado** (Sheet, Toast, ErrorState, escala de spacing, formatters, offline). A ausência desses blocos força reimplementações divergentes e deixa buracos de estado (erro/offline) que o usuário sente em campo.

---

## Tabela consolidada

| Item | Risco (impacto no usuário) | Esforço | Prioridade |
|---|---|---|---|
| **`EnvSwitch` DEV/PROD exposto em produção** — toggle visível nas telas pré-login (welcome/login), sem gate `__DEV__` (`EnvSwitch.tsx`; `welcome.tsx:159`; `login.tsx:54`) | Um toque acidental reaponta o app para o backend de dev: "não recebo código", dados errados, suporte insano. Superfície de risco em produção | **P** | **Crítica** |
| **Formatters de moeda e tempo divergentes** — o card de proposta usa formatter en-US ("R$ 103.2", "1h4") enquanto outras telas usam pt-BR correto (`16` vs `14`,`23`) | Preço parece errado num contexto financeiro; ETA ilegível ("1h4"). Mina confiança no caminho feliz | **P** | **Crítica** |
| **Falta `<Sheet>`/`<BottomSheet>` no kit** — 6 reimplementações idênticas de Modal+backdrop+grab handle (`DictationModal/RequestFilterSheet/RecordKmSheet/SinglePicker/LinkedPicker/DatePicker`) | Divergências reais já surgidas (padding 24 vs 28; a11y do botão fechar desigual; grab handle sem arrasto = affordance mentirosa). Cada correção precisa ser feita 6× | **M** | **Alta** |
| **Sem escala de spacing em tokens** — `theme.radius` existe, `theme.space` não; números mágicos (12/13/14/16/18/20/22…) espalhados (`themes.ts:44`; `primitives.tsx` passim) | Drift visual: `Row gap` é 13 no default mas 12/14/16 em telas diferentes; espaçamento inconsistente entre telas | **M** | **Alta** |
| **Sem refresh token — 401 = logout global silencioso** — qualquer 401 transitório derruba a sessão e joga para welcome, sem aviso (`client.ts:165`; `AuthProvider.tsx:50-54`) | Usuário "é deslogado do nada" no meio de um pedido urgente; perde contexto sem explicação | **M** | **Alta** |
| **Sem NetInfo / detecção de offline** — nenhum componente usa NetInfo; sem banner "sem conexão", sem fila offline, sem revalidação ao reconectar (busca global: 0 usos) | App de campo (motorista na estrada, cliente na rua): ações falham com alert cru; nenhum aviso de que o problema é a rede | **G** | **Crítica** |
| **`PaginatedList` sem `isError`** — a interface `InfiniteListQuery` nem expõe `isError`; query que falha mostra lista vazia, sem card de erro nem "tentar de novo" (`PaginatedList.tsx:33-41`) | Falha de rede vira tela em branco silenciosa; usuário não sabe se acabou ou quebrou; sem retry | **M** | **Alta** |
| **`Alert.alert` nativo para erros/confirmações** — sem `<Toast>`/`<Snackbar>` compartilhado; sem `ErrorBoundary` global (só em `ar-medicao.tsx`) | Erros aparecem como janela nativa bloqueante e abrupta (no web vira `window.alert` sem estilo); nenhuma recuperação graciosa | **M** | **Alta** |
| **i18n incompleto / strings hardcoded** — "New question from a pro" e perguntas de QnA em inglês num app pt-BR; labels de ícone em inglês técnico (`23`,`16`; `primitives.tsx:32`) | Quebra de idioma visível; TalkBack anuncia "bell"/"menu"; produto parece inacabado | **M** | **Média** |
| **`SlideToConfirm` sem semântica de a11y** — PanResponder puro, único meio de aceitar proposta/aprovar cobrança, sem alternativa por toque (`SlideToConfirm.tsx`; WCAG 2.5.7/4.1.2) | Bloqueio funcional total para usuário de teclado/leitor de tela: não consegue enviar pedido nem aceitar proposta | **M** | **Crítica** |
| **`BudgetMeter` sem semântica de a11y** — SVG com PanResponder, sem role adjustable/value (`BudgetMeter.tsx:84-91`) | Usuário de leitor de tela não consegue definir orçamento; etapa 6 fica inoperável | **M** | **Alta** |
| **Tipografia inline fora de `<Text variant>`** — `fontSize`/`fontWeight` cru com valores fracionários (12.5/13.5/14.5) (`primitives.tsx:129,149,162`; `Wiz.tsx:53`) | Drift tipográfico; a escala deixa de ser fonte única; ajustes de tema não propagam | **M** | **Média** |
| **Contraste AA reprovado sistemicamente** — accent 2.85:1 (CTA primário), soft 2.54, ok 2.57, ink3 2.59 (`themes.ts:64-72`; `Button.tsx:43`; `Text.tsx:26`) | Texto e CTAs difíceis de ler para baixa visão / luz forte (usuário na estrada, de dia); reprova 1.4.3 no botão mais importante | **M** | **Crítica** |
| **`Toggle` visual-only** — sem `onValueChange`/`accessibilityRole="switch"`; cada uso reimplementa o estado com Pressable externo (`primitives.tsx:282-289`) | Switches não anunciam estado ao leitor de tela; comportamento reimplementado e divergente | **P** | **Média** |
| **Card gradiente CTA e `SelectField` duplicados** — "Precisa de ajuda?" ≈ `FirstAssetCard`; 3 cópias de campo-clicável (`home.tsx:182` / `HomeAssets.tsx:154`; `LinkedPicker.tsx:129`; `primitives.tsx:231`; `DatePicker.tsx:80`) | Padrões divergem com o tempo; manutenção multiplicada | **M** | **Média** |
| **Asset obrigatório bloqueia o pedido** — `canContinue` falso até existir `assetId` para categorias de veículo (`new.tsx:212`) | Motorista sem carro cadastrado é jogado num sub-wizard de cadastro no meio de uma emergência; mata conversão | **G** | **Crítica** |
| **Wizard de 7 etapas fixas, sem pular vazias** — `stepKeys = STEP_KEYS` sempre; `visibleQuestions.length===0` renderiza tela cheia mesmo assim (`new.tsx:116,384`) | Telas vazias/opcionais consomem toques; fricção excessiva para urgência | **G** | **Alta** |
| **Filtro de lista client-side** — `matches` sobre páginas carregadas; `filteredCount` conta só o que baixou (`requests.tsx:37-40`) | Contagem de filtro mente ao usuário (inconsistência de dados visível) | **M** | **Média** |
| **Campo de data como texto ISO** — `Field` com placeholder "2026-06-25" e regex, não date picker (`reschedule.tsx:36`) | Erro por formato garantido; sem calendário; inacessível | **P** | **Alta** |
| **Realtime não reconecta em troca de token** — socket singleton autenticado com o token do momento da conexão (`echo.ts:24,66`) | Após refresh, atualizações ao vivo (propostas/rastreio) podem parar de chegar silenciosamente | **M** | **Média** |
| **Anel pulsante perpétuo no badge do sino** — `Animated.loop` enquanto houver não-lidas (`primitives.tsx:51-59`) | Sino "respirando" para sempre = ruído/ansiedade + consumo de bateria | **P** | **Baixa** |
| **Estilos inline em ~23 componentes** — objetos recriados a cada render; só `Text`/`Button` usam `StyleSheet.create` | Alocação por render em listas grandes (jank em scroll longo) | **M** | **Baixa** |
| **`focusRing` só no web e incompleto** — sheets/PickerField/BackBar/Wiz/"marcar todas" sem indicação de foco (`a11y.ts:9`) | Usuário de teclado (web) sem foco visível; reprova 2.4.7/2.4.11 | **P** | **Média** |
| **Sem "Esqueci a senha" / verificação de e-mail** — ausência total no fluxo de auth (`login.tsx`) | Quem loga por senha e esquece fica preso; contas com e-mail não verificado | **M** | **Alta** |
| **Vazamento de host no erro de login** — `formError` imprime "API: <host do backend>" ao usuário (`login.tsx:82-83`) | Expõe infra de produção; mensagem técnica assusta o usuário | **P** | **Alta** |

---

## Priorização (ordem de ataque)

**Crítica — atacar primeiro (segurança/conversão/bloqueio funcional):**
1. Gate `__DEV__` no `EnvSwitch` + remover "API: host" do erro (2 linhas, P).
2. Formatter único de moeda (`formatBRL`) e de tempo (`formatEta`) — P, elimina o pior bug visível do caminho feliz.
3. Asset opcional no pedido (`new.tsx:212`) — G, mas é o gargalo de conversão nº 1.
4. Acessibilizar `SlideToConfirm` (alternativa por toque) e escurecer `accent` — desbloqueiam a11y.
5. `useConnectivity()` + `<OfflineBanner>` — G, mas essencial para app de campo.

**Alta — infraestrutura de estado e primitivos:**
6. `<Sheet>` compartilhado; `theme.space`; `<Text variant>` — pagam dívida de 6+ reimplementações.
7. `isError`/`refetch` em `PaginatedList` + `<ErrorState>` + `<Toast>` + `ErrorBoundary`.
8. Refresh token / soft-retry no 401; "Esqueci a senha"; pular etapas vazias do wizard.

**Média/Baixa — polimento e performance:**
9. `Toggle` real, dedup de CTA/SelectField, i18n completo, reconexão de socket, `StyleSheet.create`, anel do sino.

O caminho de maior alavancagem: **os itens P Críticos (EnvSwitch, formatters, host no erro) custam poucas linhas e removem os problemas mais visíveis**; em seguida a extração dos primitivos (`<Sheet>`, `theme.space`, `<ErrorState>`) paga a dívida estrutural que multiplica o custo de toda correção futura.
