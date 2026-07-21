# Relatório Executivo — Auditoria UX/UI do App do Cliente (Chama Fácil)

**Escopo:** app `customer` + design system compartilhado. **Método:** walkthrough real em device Android (adb) + leitura de 100% das telas + heurísticas (Nielsen, leis de UX, Gestalt) + WCAG 2.2. **Data:** 2026-07-20.

---

## 1. Resumo geral

O Chama Fácil é um marketplace de serviços sob demanda com **fundações técnicas e visuais acima da média para o estágio**: design system centralizado e tematizado (light/dark), realtime funcionando (propostas entram sozinhas, com chime), rastreio ao vivo com stepper + mapa + **código de início**, e transparência de preço no orçamento (valor sugerido + média da região). O caminho feliz **funciona de ponta a ponta** e tem momentos de deleite reais.

Porém, para o objetivo declarado — **escalar para milhares de usuários** — o produto ainda não está pronto. Os problemas não são de "fundação", são de **foco do fluxo, acessibilidade e consistência**. Três frentes concentram o risco:

1. **Fricção no funil de maior valor.** O caso de uso nº1 é emergência ("carro quebrou na estrada"), mas criar um chamado é um **wizard fixo de 7 etapas** e, em categorias de veículo, **exige cadastrar o carro como "ativo/patrimônio" antes de pedir ajuda**. São ~10 interações e 7 telas no pior momento do usuário. Isto é, ao mesmo tempo, o maior gargalo de conversão e o maior gerador de abandono.
2. **Acessibilidade reprova de forma sistêmica.** Contraste abaixo de WCAG AA em componentes-core (CTA primário branco/laranja = **2,85:1**; variantes soft/ok ≈ 2,5:1), e ações críticas **só por gesto** (aceitar proposta e aprovar sobretaxa via *slide-to-confirm*; definir orçamento via medidor arrastável) sem alternativa por toque/teclado/leitor de tela. Isso exclui uma parcela real do público e é risco jurídico/reputacional em escala.
3. **Consistência e navegação.** Três superfícies de navegação redundantes (tabs + cards da home + drawer) com a ação primária "Pedir" escondida no hambúrguer; **dois mecanismos diferentes para aceitar proposta na mesma tela**; moeda, tempo e idioma formatados de formas divergentes (`R$ 103.2` vs `R$ 120,00`; `1h4` vs `64 min`; títulos de aviso em inglês); e um **EnvSwitch DEV/PROD exposto na tela de login em produção**.

**Veredito:** produto com boa base e identidade forte, mas com um funil que precisa ser **redesenhado (não ajustado)** e uma dívida de acessibilidade/consistência que precisa virar prioridade antes de investir em aquisição. Nenhuma correção exige reescrita — quase tudo é redesenho de fluxo + evolução dos próprios tokens/componentes do DS.

### 1.1 Direção de produto já definida pelo cliente (incorporada nas recomendações)

Estas decisões foram tomadas pelo time de produto e este relatório as trata como **direção confirmada** (não como sugestão em aberto):

- **Confirmações + carregamentos** serão adicionados como padrão de interação. Isso atende diretamente os achados de "aceite sem confirmação/feedback", "envio sem momento de sucesso" e "feedback < 400ms (Doherty)". Recomendação: criar um padrão único de **diálogo de confirmação** (para ações irreversíveis/financeiras) e de **estado de carregamento** (botão `loading`, skeleton, otimista) no DS, e aplicá-lo em todo o app.
- **A criação de chamado terá etapas que variam por tipo de chamado** (fluxo adaptativo por categoria). Portanto o redesenho do funil deixa de ser "reduzir para N etapas fixas" e passa a ser **"etapas dirigidas pela categoria"** — cada tipo (guincho, bateria, encanador, limpeza…) define seus campos e sua ordem; urgência entra por um **modo expresso**. O anti-padrão a eliminar não é "ter etapas", é: etapas vazias/opcionais tratadas como tela cheia, campos fora de contexto (ex.: "ACESSO" para guincho) e ativo obrigatório antes de pedir.
- **Seleção de oferta por tela de detalhe.** Na lista de propostas, tocar numa oferta **navega para a tela de detalhe da oferta**, onde o cliente vê todas as informações; o **slide para aceitar fica dentro desse detalhe**. Isso resolve o achado de "dois mecanismos de aceite na mesma tela" e o de "aceite sem contexto/resumo": o detalhe da oferta passa a ser o lugar do resumo do compromisso + confirmação (slide) + carregamento + sucesso.

---

## 2. Scorecard (0–10)

| Dimensão | Nota | Comentário |
|---|:--:|---|
| **UX** | 5.0 | Peças ótimas (rastreio, orçamento) convivem com funil longo, feedback ausente em ações-chave e navegação redundante. |
| **UI** | 6.5 | Visual coeso, dark mode bonito, boa densidade; perde por falhas de contraste e bugs de formatação (moeda/tempo). |
| **Performance percebida** | 6.0 | Skeletons e realtime ajudam; sem estado offline, erros via alert nativo, mapa em WebView pesa. |
| **Acessibilidade (WCAG 2.2)** | 3.0 | Reprovações de contraste sistêmicas + ações só-gesto sem alternativa. Frente mais crítica. |
| **Consistência** | 5.0 | DS forte na base, mas muitas divergências de superfície (aceite, moeda, idioma, status). |
| **Controle de complexidade** | 4.5 | Wizard de 7 etapas, 3 superfícies de navegação, 6 rotas de exceção fragmentadas. |
| **Facilidade de aprendizado** | 6.0 | Rótulos e microcopy majoritariamente claros; onboarding de valor inexistente. |
| **Facilidade de uso** | 5.5 | Usuário conclui, mas com passos e dúvidas evitáveis. |
| **Nota global** | **5.1** | Base sólida; **não pronto para escala** sem as correções P0/P1. |

---

## 3. Principais problemas (por tema)

**Conversão / funil**
- Wizard de 7 etapas fixas para chamado urgente; etapa 5 é uma tela inteira só para foto opcional; etapas 3–4 são opcionais mas ocupam telas próprias.
- Ativo (veículo) obrigatório antes de pedir → sub-cadastro de "patrimônio" no pior momento.
- CTA primário ("Precisa de ajuda agora?") no fim da rolagem da home; ainda leva a `/categories` (hop extra).
- Sem ação "Pedir" persistente (FAB/aba). Sem "modo expresso".

**Acessibilidade**
- Contraste AA reprovado em CTA/soft/ok/ink3.
- `SlideToConfirm` (aceitar proposta, sobretaxa) e `BudgetMeter` (orçamento) sem role/alternativa acessível; `Stars` sem valor; alvos < 44dp; `IconButton` anuncia nome do ícone em inglês.

**Consistência & bugs de runtime**
- Dois mecanismos de aceite (slide vs botão) na mesma tela.
- Moeda quebrada no card de proposta (`R$ 103.2`), ETA `1h4` (sem "min"), i18n misturado (títulos de aviso em inglês), status todos verdes, pluralização `(s)`.
- Endereço muda entre etapas do wizard (geocodificação inconsistente).

**Navegação & IA**
- Três superfícies redundantes (tabs + home + drawer) para os mesmos destinos.
- Perfil é beco sem saída (não edita dados, sem pagamento/endereços/notificações, **sem excluir conta** → risco de rejeição nas lojas).

**Segurança/robustez que afeta UX**
- EnvSwitch DEV/PROD exposto pré-login em produção.
- Erro de login imprime o host do backend ao usuário.
- Sem "Esqueci a senha"; 401 causa logout global sem refresh token.
- Sem tratamento offline (NetInfo/banner/fila).

**Feedback / Peak-End**
- Envio do pedido não tem momento de sucesso.
- Aceitar proposta (compromisso financeiro) sem resumo/confirmação/feedback.
- Notificações sem agrupamento → badge "99+" perpétuo.

---

## 4. Fluxos que devem ser COMPLETAMENTE redesenhados

1. **Criação de pedido (o mais importante).** Trocar o wizard fixo de 7 etapas por um fluxo **adaptativo dirigido pela categoria** (decisão de produto): cada tipo de chamado define seus campos e sua ordem; o essencial (o que + onde, com localização automática) sai rápido e o resto entra por progressão. Veículo vira **contexto opcional** (placa inline, não cadastro de patrimônio); foto, perguntas dinâmicas e agendamento migram para **pós-envio/enriquecimento** quando não forem essenciais. **Modo expresso** para categorias urgentes (guincho/bateria). Regras: nada de etapa vazia como tela cheia, nada de campo fora de contexto, nada de ativo obrigatório antes de pedir.
2. **Onboarding do cliente.** Hoje inexiste (e o `FirstAssetTutorial` inverte a prioridade, empurrando cadastro de ativo). Criar onboarding **valor-primeiro**: da splash direto para "pedir ajuda", com cadastro só quando necessário para pagar.
3. **Navegação global.** Colapsar as 3 superfícies: tabs claras + **ação "Pedir" persistente**; aposentar o drawer redundante (ou reduzi-lo a conta/config).
4. **Exceções do pedido.** Consolidar 6 rotas fragmentadas: grupo A (sobretaxa/requote/reagendamento) como **sheets inline** no acompanhamento; grupo B (disputa/garantia) como **um formulário único** parametrizado. Resolver o loop sobretaxa↔requote.
5. **Perfil/Conta.** De tela morta para central real: editar dados, formas de pagamento, endereços, preferências de notificação e **exclusão de conta**.
6. **Propostas & aceite.** Padrão de seleção por **tela de detalhe da oferta** (decisão de produto): na lista, tocar numa proposta **abre o detalhe da oferta** com todas as informações; o **slide para aceitar mora dentro desse detalhe**, acompanhado de resumo do compromisso + confirmação + carregamento + sucesso. Isso elimina o "slide vs botão" na lista. Complementos: QnA simétrico (cliente também pergunta) e contraproposta multi-rodada.

---

## 5. Funcionalidades a REMOVER / esconder

- **EnvSwitch DEV/PROD** da UI de produção (gate `__DEV__` ou remover).
- **Ordenação Preço/Tempo/Nota** enquanto há **0 propostas** (aparece inútil).
- **Drawer** como superfície de navegação primária (redundante com tabs/home).
- **Etapa dedicada de foto** no wizard (absorver na descrição).
- **Medição AR (Viro)** do fluxo principal — mover para dentro de uma categoria de serviço específica onde faça sentido; hoje é distração fora de contexto.
- **Campo "ACESSO: Adulto com chave / Código de acesso"** para categorias onde não se aplica (ex.: guincho na estrada).

## 6. Funcionalidades que DEVERIAM existir

- **"Esqueci a senha"** / recuperação de conta.
- **Exclusão de conta** e gestão de dados (LGPD + exigência de loja).
- **Modo expresso / repetir último pedido** (usuário recorrente).
- **Central de mensagens** (QnA bidirecional + notificações agrupadas por pedido).
- **Estado offline** (banner + fila + revalidação ao reconectar).
- **Gestão de formas de pagamento e endereços salvos** no perfil.
- **Confirmação de conclusão pelo cliente** (liberar pagamento) — hoje o cliente nunca confirma o fim.
- **Preferências de notificação** (canal/tipo/silenciar).

---

## 7. Telas excessivamente carregadas / com problema de densidade

- **Aba "Acompanhamento" do pedido** — até ~13 blocos condicionais numa tela, com peças e valores duplicados (sobrecarga no estado avançado).
- **Home** — ordem invertida de importância (patrimônio no topo, pedir no fim), duas seções de "chamado em andamento" empilhadas.
- **Card de proposta** — muita informação simultânea (preço, ETA, badge, rating, citação, QnA inline com campo+botão) por card, multiplicada por N propostas.
- **Wizard etapa 5** — o oposto: tela quase vazia (só um botão "Adicionar foto").

## 8. Informações irrelevantes / ausentes

- **Irrelevantes:** host do backend no erro de login; nome do ícone em inglês para leitor de tela; "0.0 · 0 serviços" (deveria ser "Novo"); ordenação com 0 propostas.
- **Ausentes:** por que o "Continuar" está desabilitado; resumo do compromisso ao aceitar; confirmação de sucesso ao enviar/aceitar; estado de conexão; feedback de erro amigável (hoje `Alert.alert` nativo).

---

## 9. Melhorias de Onboarding · Conversão · Retenção · Performance percebida

**Onboarding:** da splash direto ao "pedir"; adiar cadastro; tutorial contextual só quando útil; usar o primeiro pedido como onboarding.
**Conversão (CRO):** modo expresso; ativo opcional; CTA "Pedir" persistente; reduzir campos obrigatórios; manter a transparência de preço (ótima) e reforçar prova social ("X guinchos atendidos hoje na sua região").
**Retenção:** repetir último pedido; central de mensagens; notificações úteis (não spam); avaliação leve; histórico com recibo claro.
**Performance percebida:** unificar skeleton/spinner; feedback <400ms (Doherty) em toda ação; otimista no aceite; pré-carregar mapa; substituir alert nativo por toast.

## 10. Iniciantes vs. Avançados

- **Iniciantes:** rótulos persistentes (não placeholder-como-label), microcopy de erro, onboarding de valor, menos escolhas por tela (Hick).
- **Avançados:** modo expresso, repetir pedido, atalhos/ações rápidas, deep-links, menos confirmações redundantes onde não há risco.

## 11. Recomendações de evolução do Design System

- **Extrair `<Sheet>`** (elimina 6 reimplementações de modal+backdrop+grab handle).
- **Escala de spacing tokenizada** (`space.1…space.8`) — hoje são números mágicos com drift.
- **`<StatusPill>`** com cores por estado (ativo vs concluído) — acabar com "tudo verde".
- **`<Price>`** com formatter pt-BR único; **utilitário de tempo/ETA** único; **pluralização i18n**.
- **`<SlideToConfirm>` e `<BudgetMeter>` acessíveis** (role adjustable, alternativa por toque/teclado, `accessibilityValue`).
- **Corrigir a paleta para WCAG AA** (accent/on-accent, soft, ok, ink3) — decisão de token, propaga sozinha.
- **`<GradientCTACard>`** compartilhado; primitives usando variantes de `<Text>` em vez de tipografia inline.

---

## 12. Matriz Impacto × Esforço

```
IMPACTO
  ALTO │  (A) FAÇA JÁ / QUICK WINS            │ (B) GRANDES APOSTAS
       │  • Formatter de moeda/ETA único      │ • Redesenho do funil (≤4 toques)
       │  • Gate __DEV__ no EnvSwitch         │ • Onboarding valor-primeiro
       │  • Corrigir paleta p/ AA (tokens)    │ • Navegação: ação "Pedir" persistente
       │  • Unificar mecanismo de aceite      │ • Acessibilizar Slide/BudgetMeter
       │  • i18n dos títulos de aviso         │ • Central de mensagens + notif. agrupadas
       │  • "Esqueci a senha"                 │ • Perfil/Conta completo (+excluir conta)
       │  • Confirmação no logout             │ • Consolidar exceções (sheets/form único)
       │  • StatusPill (cores por status)     │
  ─────┼──────────────────────────────────────┼───────────────────────────────
       │  (C) PREENCHIMENTO                    │ (D) REPENSAR / DEPOIS
  BAIXO│  • Pluralização "(s)"                 │ • Medição AR fora do funil
       │  • Esconder ordenação c/ 0 propostas  │ • Requoting multi-rodada avançado
       │  • "Novo" em vez de "0.0"            │ • Animações/deleite extra
       │  • Contraste do link "Cancelar"      │
       │       BAIXO ESFORÇO      ⟵——————————⟶      ALTO ESFORÇO
```

Priorize o quadrante **(A)** imediatamente (semanas 1–3) e trate **(B)** como os épicos do roadmap (ver `roadmap.md`). **(D)** só depois de (A)+(B).

---

## 13. Top 20 Quick Wins (detalhe em `quick-wins.md`)

| # | Quick Win | Esforço | Impacto |
|:--:|---|:--:|:--:|
| 1 | Formatter de moeda pt-BR único (corrige `R$ 103.2`) | P | Alto |
| 2 | Gate `__DEV__` / remover EnvSwitch da UI de produção | P | Alto |
| 3 | Traduzir títulos de aviso ("New question from a pro") | P | Alto |
| 4 | Unificar ETA (`1h4` → `~1h04`/min consistente) | P | Médio |
| 5 | `<StatusPill>` com cores por estado (fim do "tudo verde") | P | Alto |
| 6 | Confirmação antes do logout | P | Médio |
| 7 | Adicionar link "Esqueci a senha" | P | Alto |
| 8 | "Novo" / "Sem avaliações" em vez de "0.0 · 0 serviços" | P | Médio |
| 9 | Esconder ordenação Preço/Tempo/Nota com 0 propostas | P | Médio |
| 10 | Mensagem explicando por que "Continuar" está desabilitado | P | Alto |
| 11 | Rótulos persistentes (não placeholder-como-label) no login | P | Alto |
| 12 | `autoComplete`/`textContentType` nos campos de auth | P | Alto |
| 13 | Corrigir paleta accent/soft/ok/ink3 para WCAG AA (tokens) | P/M | Alto |
| 14 | Não vazar host do backend no erro de login | P | Médio |
| 15 | Pluralização i18n ("5 propostas", "1 proposta") | P | Baixo |
| 16 | Unificar mecanismo de aceite (slide OU botão, não os dois) | M | Alto |
| 17 | Keyboard-avoidance no campo de descrição | P | Médio |
| 18 | Esconder campo "ACESSO" quando não se aplica (guincho) | P | Médio |
| 19 | Contraste do link "Cancelar chamado" | P | Baixo |
| 20 | `accessibilityLabel`/`Role` nos Pressables custom principais | M | Alto |

---

## 14. Top 100 melhorias priorizadas

> Priorização por tier (P0 = crítico/bloqueia escala, P1 = alto, P2 = médio, P3 = polimento). Detalhe e evidência em [`findings.md`](findings.md) e nos relatórios por módulo.

### P0 — Crítico (fazer antes de escalar) — 1–22
1. Redesenhar o funil de criação para envio em ≤4 toques (modo expresso p/ urgências).
2. Tornar o veículo/ativo **opcional** na criação (placa inline em vez de cadastro obrigatório).
3. Corrigir paleta para WCAG AA (CTA/on-accent, soft, ok, ink3).
4. `SlideToConfirm` acessível (alternativa por toque/teclado + role + `accessibilityValue`).
5. `BudgetMeter` acessível (stepper por toque + role adjustable).
6. Remover EnvSwitch DEV/PROD da UI de produção (gate `__DEV__`).
7. Adicionar recuperação de senha ("Esqueci a senha").
8. Adicionar exclusão de conta + gestão de dados (LGPD/lojas).
9. Não vazar host do backend em mensagens de erro.
10. Rótulos persistentes nos formulários (remover placeholder-como-label).
11. `autoComplete`/`textContentType` em todos os campos de auth (habilitar gerenciador de senha).
12. Ação "Pedir" persistente na navegação (FAB/aba dedicada).
13. Formatter de moeda pt-BR único (corrige `R$ 103.2`).
14. Aceite via **tela de detalhe da oferta** com o slide dentro (fim do slide-vs-botão na lista) — direção de produto.
15. Padrão de **confirmação + carregamento + sucesso** para ações irreversíveis/financeiras (aceitar, cancelar, disputar) — direção de produto.
16. Data no reagendamento via **date picker** (não texto ISO).
17. Traduzir strings hardcoded em inglês (títulos de aviso, QnA do app).
18. Introduzir estado **offline** (NetInfo + banner + fila básica).
19. Corrigir hierarquia da Home (pedir ajuda como ação nº1, patrimônio abaixo).
20. `StatusPill` com cores por estado (diferenciar ativo/concluído).
21. Repassar dados do ativo ao prestador (evitar perguntas sobre marca/modelo já conhecidos).
22. Momento de sucesso ao enviar o pedido (Peak-End).

### P1 — Alto — 23–52
23. Colapsar navegação redundante (aposentar/reduzir drawer).
24. Onboarding valor-primeiro (splash → pedir).
25. Consolidar exceções grupo A (sobretaxa/requote/reagendar) em sheets inline.
26. Unificar disputa/garantia num formulário parametrizado.
27. Resolver loop sobretaxa↔requote.
28. QnA simétrico (cliente também pergunta).
29. Central de mensagens (mensagens + notificações agrupadas por pedido).
30. Agrupar notificações por pedido (acabar com "99+").
31. Perfil editável (nome/e-mail/telefone/foto).
32. Gestão de formas de pagamento no perfil.
33. Gestão de endereços salvos.
34. Preferências de notificação.
35. Confirmação de conclusão pelo cliente (liberar pagamento).
36. Refresh token (evitar logout global em 401).
37. Substituir `Alert.alert` por toast/feedback in-app consistente.
38. `PaginatedList` expor/renderizar estado de erro.
39. ErrorBoundary global + tela de erro amigável.
40. Reduzir wizard: absorver etapa de foto na descrição.
41. Adaptar campos ao tipo de serviço (esconder "ACESSO" p/ guincho).
42. Mapa/pino coerente com a copy ("ajuste o pino") desde o início.
43. Confirmação no logout.
44. Links de ação como botão real (role + contraste + alvo ≥ 44dp).
45. Termos/Privacidade clicáveis no cadastro.
46. `accessibilityLabel`/`Role` nos Pressables custom das telas.
47. `Stars` com valor/nome acessível.
48. `IconButton` sem anunciar nome do ícone em inglês.
49. Keyboard-avoidance no campo de descrição.
50. Unificar formatação de ETA em todas as superfícies.
51. Modo expresso / repetir último pedido (recorrente).
52. Extrair `<Sheet>` compartilhado (elimina 6 duplicações).

### P2 — Médio — 53–80
53. Escala de spacing tokenizada (`space.*`).
54. `<Price>` e utilitário de tempo compartilhados.
55. `<GradientCTACard>` compartilhado.
56. Primitives usando variantes de `<Text>` (sem tipografia inline).
57. Reduzir densidade da aba Acompanhamento (progressive disclosure).
58. Remover duplicação de peças/valores no acompanhamento.
59. Esconder ordenação Preço/Tempo/Nota com 0 propostas.
60. "Novo"/"Sem avaliações" em vez de "0.0".
61. Semântica de cor do medidor de orçamento mais clara.
62. Endereço estável entre etapas do wizard.
63. Explicar por que "Continuar" está desabilitado.
64. Contraste do link "Cancelar chamado".
65. Focus ring/estados de foco além do web (sheets/pickers/BackBar/Wiz).
66. Alvos de toque ≥ 44dp em toda a UI.
67. Skeleton/spinner: escolher um padrão por contexto e documentar.
68. Pré-carregar/otimizar mapa Leaflet (WebView).
69. Feedback otimista no aceite/ações.
70. Reduzir badge pulsante perpétuo do sino (só quando há novidade).
71. Recibo unificado (hoje 2 superfícies).
72. Unificar as 3 superfícies de avaliação.
73. Empty states com ação (não só ilustração).
74. Deep-links consistentes para pedido/proposta.
75. Revalidação de dados ao reconectar.
76. Mensagens de validação inline nos formulários do wizard.
77. Máscaras/teclado corretos por campo (telefone, placa, etc.).
78. Autofocus no primeiro campo de cada etapa.
79. Consolidar padrões de card (mesma anatomia entre módulos).
80. Documentar tokens/uso no DS (guia de contribuição).

### P3 — Polimento / avançado — 81–100
81. Pluralização i18n global ("(s)" → formas corretas).
82. Microcopy de erro amigável em toda a app.
83. Animações de transição consistentes entre telas.
84. Haptics padronizado nas confirmações.
85. Prova social na home/criação ("X atendimentos hoje perto de você").
86. Estimativa de tempo até 1ª proposta ("normalmente < 5 min").
87. Compartilhar status do chamado (link/print) com terceiros.
88. Favoritar prestador / preferir recorrente.
89. Chat/áudio curto opcional no acompanhamento (além do QnA).
90. Modo de alto contraste / tamanho de fonte respeitando o sistema.
91. Suporte a landscape/tablet (maxWidth já corrigido — evoluir grid).
92. Medição AR movida para dentro de categoria de serviço pertinente.
93. Contraproposta multi-rodada estruturada.
94. Onboarding progressivo de recursos avançados.
95. Histórico com filtros/busca.
96. Recibo exportável (PDF/compartilhar).
97. Programa de indicação/retenção.
98. Estado de "prestador digitando/atualizando" no acompanhamento.
99. Telemetria de funil (medir abandono por etapa) para CRO contínuo.
100. Testes de acessibilidade automatizados no CI (evitar regressão de contraste).

---

## 15. Próximos passos

1. **Sprint 1–2 (semanas 1–3):** todos os P0 de baixo esforço (quadrante A) + começar o redesenho do funil. Ver [`roadmap.md`](roadmap.md).
2. **Sprint 3–6:** épicos P1 (navegação, onboarding, exceções, perfil, mensagens).
3. **Contínuo:** telemetria de funil + testes de acessibilidade no CI.
4. **2ª rodada:** repetir esta auditoria no app **Provider** e no admin **Filament**.

> Este resumo é executivo. A rastreabilidade completa (achado → evidência `arquivo:linha`/screenshot → solução) está em [`findings.md`](findings.md) e nos relatórios por módulo.
