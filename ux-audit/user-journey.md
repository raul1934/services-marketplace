# Jornadas do Usuário por Persona — App Customer (Chama Fácil)

**Produto:** Chama Fácil — marketplace de serviços sob demanda (React Native / Expo Router)
**Base:** walkthrough dinâmico no device (Samsung, Android, dark mode) + 4 relatórios de cluster estático
**Data:** 2026-07-20 · Idioma: pt-BR
**Caminho real percorrido:** Home → atalho "Guincho" → wizard de 7 etapas → envio (slide) → detalhe "Aberto" (0 propostas) → propostas em tempo real (4→5) → aceite (slide) → rastreio ao vivo. Evidências em `ux-audit/screens/00b–23`.

Severidade: **Crítico / Alto / Médio / Baixo** · Esforço: **P / M / G**.

> Nota metodológica: as quatro personas abaixo são as do `dynamic-walkthrough.md`. Todas percorrem o **mesmo túnel de 7 etapas** — não existe caminho expresso, nem modo simplificado, nem ajuste por urgência (`new.tsx:116`, `stepKeys = STEP_KEYS` sempre). Por isso o mesmo fluxo produz atritos diferentes conforme o perfil.

---

## Visão geral do funil percorrido (comum a todas as personas)

| Fase | Tela(s) | Evidência |
|---|---|---|
| Abertura | Home (saudação → Meus ativos → Ajuda Rápida → CTA no rodapé) | `00b`, `22` |
| Entrada no fluxo | Atalho "Guincho" (Ajuda Rápida) | `01` |
| Criação | Wizard 7 etapas: detalhes → localização → perguntas → quando → fotos → orçamento → revisão | `02`–`12` |
| Envio | Slide-to-confirm na etapa 7 | `12`→`13` |
| Espera | Detalhe "Aberto", 0 propostas, ordenação já visível | `13` |
| Propostas | Chegam em tempo real (4→5), com chime | `16` |
| Aceite | Slide (1ª proposta) **ou** botão (demais) | `16`→`17` |
| Rastreio | Stepper Aceito→A caminho→Chegou→Concluído, mapa "Ao vivo", ETA, código 7157 | `17` |

**Contagem de toques até enviar (persona aflita):** ~10 interações + 7 telas (`dynamic-walkthrough.md:12`). Muito alto para uma emergência.

---

## Persona 1 — "Aflito na estrada" (persona-âncora)

**Contexto:** carro quebrou à noite, pouca bateria no celular, pressa e estresse alto. Quer guincho **já**.
**Objetivo:** enviar o pedido de socorro no menor tempo possível e ver alguém a caminho.

### Roteiro passo-a-passo (caminho real)

1. Abre o app → Home. A primeira coisa que vê é **"Meus ativos" (patrimônio)**, não "pedir ajuda" (`home.tsx:133-197`, ev. `00b`/`22`). **[Atrito]**
2. Rola até "Ajuda Rápida" e toca **"Guincho"** (toque 1) → wizard etapa 1/7 (`01`).
3. Etapa 1 — foca a descrição (toque 2). O **teclado sobe e encobre o campo** "O que aconteceu?" (`03`/`04`). **[Atrito Médio]** Digita "Carro não liga".
4. Toca "Continuar" com o texto curto → às vezes **nada acontece** e não há mensagem do que falta (`02`, `new.tsx:211-217`). **[Atrito Alto]**
5. Etapa 2 — localização. Vê o campo **"ACESSO: Adulto com chave / Código de acesso"** (campo de serviço doméstico) num guincho de estrada (`06`, `dynamic-walkthrough.md:38`). **[Atrito Alto, confusão]** Toca "Usar minha localização" (toque 4) → só então o mapa/pino carrega (a copy prometia pino antes, `06`→`07`). **[Atrito Alto]**
6. Etapas 3→6 — toca "Continuar" quatro vezes (toques 5–8). A **etapa 5 é uma tela inteira só para foto opcional** (`10`). Etapa 6 (orçamento) mostra "Guincho custa em média R$120 nesta região" (**bom**, `11`).
7. Etapa 7 — revisão com edição in-place por linha (**bom padrão**, `12`), depois **arrasta para enviar** (toque 10).
8. Cai **direto** no detalhe "Aberto", 0 propostas — **sem celebração/confirmação** (`13`, `dynamic-walkthrough.md:46`). **[Vale emocional]**
9. Propostas chegam sozinhas (4→5) com chime (`16`). Vê preços quebrados **"R$ 103.2 / R$ 115.2"** e prestador **"0.0 · 0 serviços"** com estrelas vazias (parece nota zero). **[Atrito Alto]**
10. Aceita a melhor: na 1ª proposta **arrasta**; nas outras é **botão** — dois controles para a mesma ação (`16`). **[Atrito Alto]** Sem "confirmar contratação por R$X". Transiciona direto ao rastreio.
11. Rastreio ao vivo: mapa "Ao vivo", **9,0 km · chega em ~16 min**, código de início **7157** (`17`). **[Pico emocional]** Alívio: alguém está vindo.

### Pontos de atrito (com evidência)

| # | Atrito | Severidade | Evidência |
|---|---|---|---|
| 1 | Ação de pedir está em 3º/4º lugar; patrimônio no topo | Alto | `home.tsx:133-197`; `00b`,`22` |
| 2 | 7 etapas para um chamado urgente, sem modo expresso | Crítico | `new.tsx:116`; `01`,`06`–`12` |
| 3 | Teclado cobre o campo de descrição | Médio | `03`,`04` |
| 4 | "Continuar" desabilitado sem explicar o que falta | Alto | `new.tsx:211-217`; `02` |
| 5 | Campo "ACESSO" (doméstico) num guincho de estrada | Alto | `06` vs `08` |
| 6 | Copy promete pino/mapa que só aparece após tocar "Usar localização" | Alto | `06` vs `07` |
| 7 | Sem momento de sucesso ao enviar | Médio | `12`→`13` |
| 8 | Moeda quebrada "R$ 103.2" nas propostas | Alto | `16` vs `14` |
| 9 | Provider novo aparece como "0.0" (parece nota zero) | Médio | `16` |
| 10 | Dois mecanismos de aceite na mesma tela | Alto | `16` |
| 11 | Aceite = compromisso financeiro sem resumo/confirmação | Alto | `16`→`17` |
| 12 | Endereço muda entre etapas (geocode inconsistente) | Médio | `07` vs `12`/`14` |

### Jornada emocional (Peak-End)

```
Estresse
 alto  ●╮ (abre e vê inventário, não socorro)
       │ ╲
       │  ●╮ (teclado cobre campo; "Continuar" não faz nada)
       │   ╲
       │    ●╮ (campo ACESSO confunde; 7 etapas arrastando)
       │     ╲___
       │         ●  ── VALE: envia e cai em "Aberto" sem celebração
 neutro│        ╱ ╲
       │       ╱   ●╮ (moeda quebrada; dois botões de aceite)
       │      ╱     ╲
 alívio│     ╱       ●━━━━━━● PICO: "Ao vivo · chega em ~16 min · 7157"
       └─────────────────────────────────────────►  tempo
```
- **Pico (positivo):** o rastreio ao vivo com ETA e código de início (`17`) — é o momento que redime o esforço.
- **Vale (negativo):** o anticlímax do envio (`13`) — o maior esforço (arrastar após 7 telas) não é recompensado; o app não diz "recebemos, procurando profissionais".
- **Regra Peak-End:** hoje o app tem um bom **End** (rastreio) mas nenhum **Peak positivo** no meio, e um vale bem no ponto de maior investimento. Um `SuccessSplash` no envio (o componente já existe no DS) transformaria o vale em micro-pico.

### Mapa de jornada — persona "Aflito na estrada"

| Fase | Ação | Emoção | Atrito | Oportunidade |
|---|---|---|---|---|
| Chegada | Abre o app com o carro quebrado | Ansioso, com pressa | Home mostra patrimônio primeiro; CTA de socorro rola para fora | CTA "Pedir agora" fixo na thumb-zone (FAB); atalhos de emergência no topo |
| Entrada | Toca "Guincho" na Ajuda Rápida | Aliviado (achou o atalho) | Depende do slug estar em `QUICK_HELP_SLUGS` | Manter atalhos; garantir cobertura das categorias urgentes |
| Descrição | Digita "carro não liga" | Frustrado | Teclado cobre o campo; "Continuar" morto sem aviso | Keyboard-avoidance; mensagem inline "descreva para continuar"; ditado por voz em destaque |
| Localização | Toca "Usar minha localização" | Impaciente | Campo "ACESSO" fora de contexto; pino só aparece depois | Esconder campos não aplicáveis à categoria; carregar mapa antecipado; skeleton no card |
| Detalhes | Passa por perguntas/quando/fotos | Cansado | 4 telas quase vazias, tudo opcional | Colapsar opcionais; pular etapas vazias; mover para "adicionar detalhes" pós-envio |
| Orçamento | Vê "R$120 em média nesta região" | Confiante | Semântica de cor do medidor (vermelho→verde) confunde | Manter ancoragem; revisar cores do medidor |
| Envio | Arrasta para enviar | Expectativa | **Cai em "Aberto" sem celebração** | `SuccessSplash` "Pedido enviado! Procurando profissionais…" |
| Espera | Vê "0 propostas", ordenação visível | Ansioso | Ordenação Preço/Tempo/Nota com 0 propostas | Esconder ordenação até haver propostas; skeleton de "buscando" |
| Propostas | Recebe 5 propostas ao vivo | Animado | Moeda "R$ 103.2"; provider "0.0"; dois botões de aceite | Formatter único de moeda; "Novo" em vez de "0.0"; um só mecanismo de aceite |
| Aceite | Aceita a melhor proposta | Decidido, mas inseguro | Sem resumo/confirmação do compromisso financeiro | Sheet de confirmação "Contratar X por R$Y?" + feedback de sucesso |
| Rastreio | Vê mapa ao vivo + ETA + código | **Aliviado (pico)** | ETA inconsistente entre superfícies | Unificar ETA; manter o rastreio como está (é o ponto forte) |

### Recomendações específicas (Aflito na estrada)
1. **[Crítico · G]** Criar caminho expresso de 1–2 telas: localização (auto) + descrição por voz (opcional) + orçamento com defaults; perguntas/fotos/agendamento viram "adicionar detalhes" pós-envio (`cluster-home-create-assets.md §10`).
2. **[Alto · M]** CTA "Pedir agora" fixo (FAB/aba central) e atalhos de emergência no topo da Home.
3. **[Alto · P]** Esconder o campo "ACESSO" quando a categoria é veículo/estrada.
4. **[Médio · P]** `SuccessSplash` no envio do pedido — fechar o vale emocional.
5. **[Alto · P]** Formatter único de moeda e mecanismo único de aceite; confirmação antes do compromisso financeiro.

---

## Persona 2 — "Primeira vez / baixa maturidade digital"

**Contexto:** instalou o app agora, usa pouco smartphone, não sabe o que é "wizard", "slide-to-confirm" nem "asset".
**Objetivo:** conseguir ajuda sem se perder; entender o que cada tela pede.

### Roteiro passo-a-passo (caminho real)
1. Primeiro acesso → **modal full-screen "cadastre seu patrimônio"** abre automaticamente (`HomeAssets.tsx:55` → `FirstAssetTutorial`, `cluster-home-create-assets.md §7`). A primeira ação sugerida é **cadastrar a casa/carro/pet**, não pedir ajuda. **[Atrito Crítico de expectativa]**
2. Fecha o tutorial (é skipável, mas o fardo cognitivo já veio) e toca "Guincho".
3. Etapa 1 — se não tem veículo cadastrado, **é obrigado a criar um asset** (batizar o carro "Meu Gol", marca/modelo/km) antes de continuar (`new.tsx:212`, `assets/new.tsx:156-160`). **[Bloqueio Crítico]**
4. Não entende por que "Continuar" está cinza (sem mensagem, `new.tsx:211-217`). **[Atrito Alto]**
5. Passa pelas 7 etapas sem saber quais campos são obrigatórios (nada sinalizado).
6. Na etapa 7, vê **"Arraste para enviar"** — gesto pouco familiar; pode não perceber que precisa arrastar (`12`). **[Atrito Médio]**
7. Recebe propostas; vê "0.0 · 0 serviços" e interpreta como **nota ruim** (`16`). **[Atrito Médio]**
8. Vê **dois controles diferentes** para aceitar (slide vs botão) e não sabe se fazem a mesma coisa (`16`). **[Atrito Alto]**

### Pontos de atrito
| # | Atrito | Severidade | Evidência |
|---|---|---|---|
| 1 | Onboarding empurra cadastro de patrimônio, não pedir ajuda | Crítico | `HomeAssets.tsx:55`; `FirstAssetTutorial` |
| 2 | Asset obrigatório bloqueia o pedido | Crítico | `new.tsx:212` |
| 3 | Sem sinalização de campos obrigatórios/opcionais | Alto | `register.tsx`; `new.tsx` |
| 4 | Placeholder-como-label: ao digitar, o rótulo some | Crítico | `AuthField.tsx:35` |
| 5 | Gesto de slide desconhecido, sem alternativa por toque | Alto | `SlideToConfirm.tsx`; `12`,`16` |
| 6 | "0.0" interpretado como nota ruim | Médio | `16` |
| 7 | Dois mecanismos de aceite confundem | Alto | `16` |

### Jornada emocional (Peak-End)
- **Vales:** o tutorial de inventário logo na chegada (confusão sobre "o que é isso?") e o bloqueio de asset obrigatório (sensação de "não consigo nem pedir").
- **Pico:** ver propostas reais chegando — prova de que o app "funciona".
- **End:** o rastreio ao vivo é claro e tranquiliza (o stepper com 4 passos é legível).

### Recomendações específicas
1. **[Crítico · G]** Inverter o onboarding: ação primária = "Preciso de ajuda agora"; cadastrar patrimônio = secundária/adiável (`cluster-home-create-assets.md §7.2`).
2. **[Crítico · M]** Tornar o veículo **opcional** com placa/modelo inline; nunca pré-cadastro bloqueante.
3. **[Alto · P]** Mensagem inline explicando por que "Continuar" está desabilitado.
4. **[Alto · P]** Rótulos persistentes acima dos campos (não placeholder-como-label).
5. **[Alto · P]** Um só mecanismo de aceite + "Novo" em vez de "0.0".
6. **[Médio · P]** Legenda/hint no slide ("arraste o botão para a direita").

---

## Persona 3 — "Recorrente / experiente"

**Contexto:** já usou o app, tem asset cadastrado, sabe o caminho, quer eficiência e previsibilidade.
**Objetivo:** repetir pedidos rápido, acompanhar vários chamados, negociar preço.

### Roteiro passo-a-passo (caminho real)
1. Abre a Home, já sabe rolar até "Ajuda Rápida" (mas ainda precisa rolar — **sem FAB fixo**).
2. Toca a categoria → wizard. Como já tem 1 asset do tipo, ele é **auto-selecionado** com microcopy clara (**bom**, `dynamic-walkthrough.md:51`).
3. Ainda assim **percorre as 7 etapas** — sem atalho para quem já sabe o que quer. **[Atrito Alto: falta flexibilidade]**
4. Recebe propostas; quer **negociar** → usa "Propor outro valor" (contraproposta). Descobre que é **rodada única**: se o prestador recontrapropõe, só pode aceitar/recusar (`ProposalsList.tsx:390`). **[Atrito Médio]**
5. Quer **perguntar** algo ao prestador ("aceita pix?") e **não tem como** — só o prestador pergunta (`cluster-request-lifecycle.md §12`). **[Atrito Alto]**
6. Acompanha vários pedidos na aba Chamados; **status todos verdes** (Aceito/Em atendimento/Concluído) — não distingue ativo de concluído num relance (`20`). **[Atrito Médio]**
7. Filtra a lista, mas a **contagem mente** (filtro client-side sobre páginas carregadas, `requests.tsx:37`). **[Atrito Médio]**

### Pontos de atrito
| # | Atrito | Severidade | Evidência |
|---|---|---|---|
| 1 | Sem caminho expresso mesmo para quem repete | Alto | `new.tsx:116` |
| 2 | Contraproposta é rodada única | Médio | `ProposalsList.tsx:390` |
| 3 | Cliente não pode perguntar ao prestador | Alto | `cluster-request-lifecycle.md §12` |
| 4 | Status todos verdes na lista | Médio | `20` |
| 5 | Contagem de filtro enganosa (client-side) | Médio | `requests.tsx:37-40` |
| 6 | Sem FAB "Pedir" persistente | Alto | `_layout.tsx` |
| 7 | Spam de notificações (99+), sem agrupar por pedido | Médio | `23`,`00b` |

### Jornada emocional (Peak-End)
- **Picos:** auto-seleção do asset, edição in-place na revisão, realtime das propostas — o experiente valoriza esses acertos.
- **Vales:** repetir 7 etapas toda vez; negociação truncada; lista sem hierarquia de status.
- **End:** positivo no rastreio, mas o "beco sem saída" do Perfil (não edita nada) frustra quem quer gerenciar a conta.

### Recomendações específicas
1. **[Alto · G]** Modo expresso / "repetir último pedido" para recorrentes.
2. **[Alto · M]** QnA simétrico (cliente também pergunta) + 2ª rodada de contraproposta.
3. **[Médio · P]** Cores/badges distintas por status na lista (ativo ≠ concluído).
4. **[Médio · M]** Filtro server-side + contagem real na lista de pedidos.
5. **[Médio · M]** Agrupar notificações por pedido (1 pedido = 1 fio, não 10 avisos).
6. **[Alto · M]** FAB "Pedir" persistente na navegação.

---

## Persona 4 — "Idoso / acessibilidade"

**Contexto:** usa leitor de tela (TalkBack) ou tem baixa visão / motricidade reduzida; fontes maiores; toques imprecisos.
**Objetivo:** completar o pedido de forma operável e anunciada, sem depender de gestos finos.

### Roteiro passo-a-passo (caminho real + barreiras de a11y)
1. Home — os tiles de "Ajuda Rápida" e o card gradiente **podem não expor `accessibilityRole="button"`** (`home.tsx:182`, `cluster-home-create-assets.md §1.6`). **[Barreira]**
2. Campos de auth/formulário são **placeholder-como-label**: ao digitar, o rótulo some; contraste `ink3` ~2.6:1 (`AuthField.tsx:35`, `Text.tsx:25`). **[Barreira Crítica — WCAG 1.4.3/3.3.2]**
3. Erros de campo **não são anunciados** (sem `accessibilityLiveRegion`, `AuthField.tsx:42`). **[Barreira]**
4. Etapa 6 — o **medidor de orçamento (`BudgetMeter`) é um SVG com PanResponder sem semântica** de a11y: usuário de leitor de tela **não consegue definir orçamento** (`BudgetMeter.tsx:84-91`, WCAG 4.1.2/2.1.1). **[Barreira Crítica]**
5. Etapa 7 e aceite — **`SlideToConfirm` é 100% arrasto, sem alternativa por toque**: usuário de teclado/TalkBack **não consegue enviar o pedido nem aceitar a proposta** (`SlideToConfirm.tsx`, WCAG 2.5.7/4.1.2). **[Bloqueio funcional total — Crítico]**
6. `Stars` (nota do prestador) **sem nome/valor**: TalkBack lê só o glifo "★", não "3 de 5" (`Stars.tsx:24-27`). **[Barreira]**
7. Perfil — botões de tema/idioma têm **38dp** (< 44dp) e não expõem `selected` (`profile.tsx:44-67`, `Button.tsx:37`). **[Barreira — alvo/estado]**
8. Textos-como-botão ("Aprovar", "Recusar", "Cancelar") são `<Text onPress>` sem role e frequentemente < 44px (`cluster-request-lifecycle.md §11.3`). **[Barreira]**
9. Reschedule — campo de data é **texto ISO "2026-06-25" com regex**, não date picker: erro por formato garantido (`reschedule.tsx:36`). **[Barreira Crítica]**

### Pontos de atrito (barreiras WCAG 2.2)
| # | Barreira | WCAG | Severidade | Evidência |
|---|---|---|---|---|
| 1 | `SlideToConfirm` só arrasto, sem alternativa | 2.5.7 / 4.1.2 / 2.1.1 | Crítico | `SlideToConfirm.tsx` |
| 2 | `BudgetMeter` sem role adjustable/value | 4.1.2 / 2.1.1 | Crítico | `BudgetMeter.tsx:84-91` |
| 3 | Placeholder-como-label + contraste ink3 | 1.4.3 / 3.3.2 | Crítico | `AuthField.tsx:35`; `Text.tsx:25` |
| 4 | Campo de data como texto ISO | 3.3.1 / 3.3.5 | Crítico | `reschedule.tsx:36` |
| 5 | `Stars` sem nome/valor | 4.1.2 | Alto | `Stars.tsx:24-27` |
| 6 | Textos-como-botão sem role, alvo < 44px | 2.5.8 / 4.1.2 | Alto | `index.tsx:469`; `ProposalsList.tsx:387-392` |
| 7 | Botões sm de tema/idioma < 44dp, sem `selected` | 2.5.8 / 4.1.2 | Alto | `profile.tsx:44-67` |
| 8 | Erros de campo não anunciados | 3.3.1 / 4.1.3 | Médio | `AuthField.tsx:42` |
| 9 | CTA primário (accent) contraste 2.85:1 | 1.4.3 | Crítico | `Button.tsx:43`; `themes.ts:64-72` |
| 10 | Seleção comunicada só por cor (Segment, chips) | 1.4.1 | Médio | `DynamicFields.tsx:63`; `AssetSelector.tsx:44` |

### Jornada emocional (Peak-End)
- **Vales severos:** dois **bloqueios funcionais totais** (enviar via slide; ajustar orçamento via medidor) — a persona simplesmente **não completa a tarefa** sozinha.
- **Pico:** quase inexistente com leitor de tela ativo; o único autofill correto do app é o OTP (`OtpInput` tem `autoComplete="sms-otp"`, `verify.tsx`).
- **End:** o rastreio tem informação boa, mas o código de início (30px, letter-spacing 6) e os cards não são anunciados de forma estruturada.

### Recomendações específicas
1. **[Crítico · M]** Dar alternativa de toque ao `SlideToConfirm` quando leitor de tela ativo (`AccessibilityInfo.isScreenReaderEnabled`) + `accessibilityRole`/`accessibilityActions`.
2. **[Crítico · M]** Acessibilizar `BudgetMeter`: `accessibilityRole="adjustable"`, `accessibilityValue`, incremento por leitor; o campo numérico como saída garantida.
3. **[Crítico · P]** Refactor central do `AuthField`: label persistente, `accessibilityLabel`, `accessibilityLiveRegion` no erro (conserta login+register de uma vez).
4. **[Crítico · P]** Trocar o campo de data do reschedule por date picker nativo.
5. **[Alto · P]** Rotular `Stars` (role adjustable + value) e trocar `<Text onPress>` por `Pressable role=button` com alvo ≥44dp.
6. **[Crítico · P]** Escurecer o `accent` (ou usar `ink` no texto) para o CTA primário atingir ≥4.5:1; migrar texto `ink3`→`ink2`.
7. **[Alto · P]** Botões de tema/idioma ≥44dp + `accessibilityState={{selected}}`.

---

## Síntese entre personas

| Atrito estrutural | Aflito | Primeira vez | Recorrente | Idoso/A11y |
|---|:---:|:---:|:---:|:---:|
| 7 etapas sem modo expresso | ●●● | ●●● | ●● | ●● |
| Asset obrigatório bloqueia pedido | ●● | ●●● | ○ | ●● |
| Sem sucesso no envio (vale Peak-End) | ●●● | ●● | ● | ● |
| Moeda/ETA/mecanismo de aceite inconsistentes | ●● | ●● | ●● | ●● |
| `SlideToConfirm` / `BudgetMeter` inacessíveis | ● | ●● | ● | ●●●● |
| Onboarding empurra patrimônio, não socorro | ●● | ●●● | ○ | ●● |

O denominador comum das quatro personas é o mesmo: **o app foi desenhado como CRM de patrimônio, não como app de socorro sob demanda** (`cluster-home-create-assets.md §0`). O redesenho do funil (ação primária ao topo/fixa + caminho expresso + asset opcional) beneficia **todas** as personas simultaneamente, e a correção de a11y do slide/medidor é o que separa "usável" de "bloqueado" para a persona 4.
