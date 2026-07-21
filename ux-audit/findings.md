# Achados — App Customer (Chama Fácil)

Consolidação canônica da auditoria UX/UI/Acessibilidade (WCAG 2.2) do app do Cliente.
Fontes: `_notes/cluster-auth-profile`, `cluster-home-create-assets`, `cluster-request-lifecycle`, `cluster-design-system-global`, `dynamic-walkthrough`.
Data: 2026-07-20 · Idioma: pt-BR · Achados deduplicados entre clusters (uma linha por problema, evidências agregadas).

> **Status (atualizado em 2026-07-21).** A coluna `Status` reflete o que já foi ao código: **✔ feito** com o commit, **◐ parcial** com o que sobrou, **aberto** para o resto. Fechados até agora: 18 achados + 2 dos órfãos, mais os 5 de notificação (NOTIF-06..10) descobertos *depois* da auditoria, ao testar o rastreador ao vivo no aparelho. Rastreabilidade com `quick-wins.md` pela coluna `Achado` de lá.

> **⟳ Direção de produto já definida pelo cliente** (afeta a coluna "Solução" de alguns achados): (1) serão adicionados **confirmações + estados de carregamento** como padrão; (2) a **criação terá etapas que variam por tipo de chamado** (fluxo adaptativo por categoria + modo expresso p/ urgência) — o alvo não é "N etapas fixas", e sim eliminar os anti-padrões (etapa vazia, campo fora de contexto, ativo obrigatório); (3) o **aceite de proposta passa por uma tela de detalhe da oferta**, com o **slide para aceitar dentro do detalhe** (resolve o achado de "dois mecanismos de aceite na mesma tela"). Veja `summary.md §1.1` e `roadmap.md`.

---

## Resumo por severidade

| Severidade | Qtd |
|---|---|
| Crítico | 16 |
| Alto | 33 |
| Médio | 44 |
| Baixo | 19 |
| **Total** | **112** |

| Módulo | Qtd |
|---|---|
| AUTH (autenticação/onboarding) | 18 |
| REQ (criação + ciclo de vida do pedido) | 20 |
| A11Y (acessibilidade transversal) | 14 |
| DS (design system) | 10 |
| EXC (telas de exceção) | 7 |
| CONS (consistência/runtime) | 7 |
| PROP (propostas/QnA) | 7 |
| NOTIF (notificações/realtime) | 10 |
| PROF (perfil/config) | 5 |
| HOME (home/descoberta) | 4 |
| GLOB (estados globais) | 3 |
| NAV (navegação) | 2 |
| ASSET (patrimônio) | 2 |
| PERF (débito de render) | 2 |
| AR (medição/AR) | 1 |

---

## Achados (tabela canônica, ordenada por severidade)

| ID | Módulo | Severidade | Título | Descrição curta | Evidência (file:line / screenshot) | Solução | Esforço | Impacto | Status |
|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | AUTH | Crítico | EnvSwitch DEV/PROD visível em produção | Toggle de backend exposto nas telas pré-login; um toque aponta o app real para o backend de dev. | `EnvSwitch.tsx`; `welcome.tsx:159`; `login.tsx:54` | Gate `if(!__DEV__) return null` ou gesto oculto. | P | Alto | ✔ feito (`41ade70`) |
| AUTH-02 | AUTH | Crítico | Sem recuperação de senha | Não existe "Esqueci a senha" em lugar nenhum; quem loga por e-mail/senha fica preso. | `login.tsx` (ausência) | Link + tela + endpoint de reset por e-mail. | G | Alto | aberto |
| AUTH-03 | AUTH | Crítico | Vaza host do backend no erro de login | Erro imprime `API: <host>` para o usuário final. | `login.tsx:82-83` | Remover a linha do host da mensagem. | P | Médio | ✔ feito (`41ade70`) |
| AUTH-04 | AUTH | Crítico | Placeholder-como-label + contraste ink3 no AuthField | Sem label persistente (rótulo some ao digitar); placeholder ink3 ~2.6:1. Falha 1.4.3/3.3.2. | `AuthField.tsx:35`; `Text.tsx:25` | Label persistente + placeholder em ink2; refactor central conserta login+register. | M | Alto | ◐ parcial — rotulo persistente entrou; o placeholder segue em ink3 (~2.6:1) |
| AUTH-05 | AUTH | Crítico | Sem autofill/textContentType | Nenhum campo passa `autoComplete`/`textContentType` (e-mail, senha, nome, tel); gerenciadores não preenchem. | `login.tsx:75-76`; `register.tsx:47-50` | Props obrigatórias de autofill no AuthField. | P | Alto | ✔ feito (`41ade70`) |
| REQ-01 | REQ | Crítico | Asset obrigatório bloqueia o pedido | Categorias de veículo exigem cadastrar o carro como patrimônio antes de pedir socorro; "Continuar" morto até existir assetId. | `new.tsx:212`; `AssetSelector.tsx:44` | Veículo opcional; placa/modelo inline, sem pré-cadastro. | M | Alto | aberto |
| REQ-02 | REQ | Crítico | Wizard de 7 etapas fixas sem modo expresso | Pedido urgente percorre 7 telas + slide (~10 interações); nenhuma etapa é pulada. | `new.tsx:38,116`; walkthrough #12 `01,06,08-12` | Colapsar em 1-2 telas; detalhes opcionais pós-envio. | G | Alto | aberto |
| NAV-01 | NAV | Crítico | Sem ação "Pedir" persistente na navegação | A ação de maior valor vive enterrada no scroll da Home; tab-bar (3 abas) não tem "+"/FAB. | `_layout.tsx:33-44`; walkthrough #15 `19-drawer.png` | FAB global ou aba central "Pedir". | M | Alto | aberto |
| ASSET-01 | ASSET | Crítico | Onboarding do zero abre tutorial de patrimônio | Primeira visita abre modal full-screen "cadastre seu patrimônio"; CTA leva a `/assets/new`, não a pedir. | `HomeAssets.tsx:55,125-146`; `FirstAssetTutorial.tsx:41-52` | Inverter: ação primária = pedir; cadastrar = secundário/adiável. | M | Alto | aberto |
| A11Y-01 | A11Y | Crítico | SlideToConfirm inacessível (único meio de confirmar) | Zero props de a11y, não operável por teclado/TalkBack; é o único jeito de aceitar proposta e aprovar cobranças. Falha 2.1.1/2.5.7/4.1.2. | `SlideToConfirm.tsx` (todo); `ProposalsList.tsx:382`; `surcharge.tsx:43`; `requote.tsx:41` | Role adjustable/button + `accessibilityActions` + botão-alternativa quando leitor ativo. | M | Alto | aberto |
| A11Y-02 | A11Y | Crítico | BudgetMeter inacessível | SVG com PanResponder sem role/value/teclado; usuário de leitor não define orçamento. Falha 4.1.2/2.1.1. | `BudgetMeter.tsx:84-91`; `new.tsx:456` | `accessibilityRole="adjustable"` + `accessibilityValue` + incremento por leitor. | M | Alto | aberto |
| EXC-01 | EXC | Crítico | Campo de data como texto ISO no reagendamento | Data é `Field` de texto com regex `^\d{4}-\d{2}-\d{2}$`, sem calendário/máscara. Erro garantido, inacessível. | `reschedule.tsx:36,72` | Trocar por date picker nativo. | M | Alto | aberto |
| DS-01 | DS/A11Y | Crítico | Contraste WCAG AA reprovado sistemicamente | accent 2.85:1 (CTA primário), soft 2.54:1, ok 2.57:1, ink3 2.59:1; usados como texto em todo o app. Falha 1.4.3. | `themes.ts:64-72`; `Button.tsx:43,48`; `Text.tsx:25-26`; `primitives.tsx:162,236`; lifecycle §11.4 | Escurecer accent p/ ≥4.5:1 ou tokens `*Text` escuros; ink3→decorativo. | M | Alto | ◐ parcial — accent escurecido p/ 4.29:1; soft/ok/ink3 seguem <4.5:1 |
| GLOB-01 | GLOB | Crítico | Sem detecção de conectividade (offline) | NetInfo não é usado; sem banner offline, sem fila, sem revalidação ao reconectar. Grave para app de campo. | busca global (0 usos de NetInfo) | `useConnectivity()` + `<OfflineBanner>` + `onlineManager` do React Query. | M | Alto | aberto |
| AUTH-06 | AUTH | Alto | 401 = logout global silencioso, sem refresh | Qualquer 401 transitório derruba a sessão e joga para welcome sem aviso nem refresh token. | `client.ts:165`; `AuthProvider.tsx:50-54` | Refresh token / soft-retry + aviso ao usuário. | M | Alto | aberto |
| AUTH-07 | AUTH | Alto | Cenas de onboarding não ocultas do leitor de tela | VoiceOver/TalkBack lê "R$ 95", "Melhor opção" fora de contexto. Falha 1.1.1/1.3.1. | `welcome.tsx:52-132` | `importantForAccessibility="no-hide-descendants"` + 1 label na ilustração. | P | Médio | aberto |
| AUTH-08 | AUTH | Alto | Termos/Privacidade não clicáveis | "Concorda com os Termos..." é texto puro; não há como abrir/ler. Problema legal + WCAG. | `register.tsx:60` | Links reais (`role="link"`) para páginas de Termos/Privacidade. | M | Alto | aberto |
| AUTH-18 | AUTH | Alto | Verificação de e-mail inexistente | `register()` autentica direto; contas ficam com e-mail não verificado. | `AuthProvider.tsx:70-80` | Fluxo de verificação de e-mail pós-cadastro. | G | Médio | aberto |
| HOME-01 | HOME | Alto | Hierarquia da Home: ação primária não está no topo/fixa | Ordem = patrimônio → pedidos → atalhos → CTA; "pedir" fica em 3º/4º lugar e rola para fora. | `home.tsx:133-197`; walkthrough #16 `00b,22` | CTA primária ao topo/fixa; assets como contexto. | M | Alto | ✔ feito (`3e74b76`) |
| HOME-02 | HOME | Alto | Card "Precisa de ajuda agora?" é o caminho mais lento | O botão que soa mais urgente leva a `/categories` (hop extra); atalhos acima vão direto ao wizard. | `home.tsx:182-197` | Card de emergência cria pedido direto. | P | Médio | aberto |
| REQ-03 | REQ | Alto | Sobrecarga da aba Acompanhamento (até 13 blocos) | Tela-mãe empilha propostas, mapa, obra, peças, sobretaxa, requote, recibo, resumo condicionalmente. | `index.tsx:383-571` | Sub-seções progressivas por status; tirar exceções da rolagem. | G | Alto | aberto |
| REQ-04 | REQ | Alto | Etapas opcionais renderizam tela cheia (não puladas) | `questions`/`photos` vazias consomem uma tela + "Continuar"; etapa 5 é só "adicionar foto". | `new.tsx:382-391,428`; walkthrough #12 | Pular automaticamente quando vazias; dobrar em outra etapa. | M | Alto | aberto |
| REQ-05 | REQ | Alto | "Continuar" desabilitado sem explicação | Botão cinza sem dizer o que falta (5 chars/asset); usuário em pânico "toca e nada acontece". | `new.tsx:211-217`; walkthrough #5 `02-step1-continue-empty.png` | Mensagem inline ("Descreva o problema para continuar"). | P | Alto | ✔ feito (`41ade70`) |
| REQ-06 | REQ | Alto | Location sem skeleton no card do mapa | `getCurrentCoords`+`reverseGeocode` sem feedback de progresso além de texto "locating". | `new.tsx:124-143,360` | Skeleton/progresso no card durante GPS+geocode. | P | Médio | aberto |
| REQ-07 | REQ | Alto | Campo "ACESSO" fora de contexto | Etapa 2 mostra "Adulto com chave / Código de acesso" (serviço doméstico) para guincho na estrada. | walkthrough #13 `06` vs `08` | Adaptar campos genéricos ao tipo de categoria. | M | Médio | ✔ feito (`41ade70`) |
| REQ-08 | REQ | Alto | Copy promete pino/mapa que não existe ainda | Etapa 2 diz "Ajuste o pino" mas não há mapa até tocar "Usar minha localização". | walkthrough #14 `06` vs `07` | Corrigir copy ou renderizar o mapa antecipado. | P | Médio | aberto |
| PROP-01 | PROP | Alto | Aceitar proposta sem confirmação nem feedback de sucesso | Ação irreversível/financeira; slide aceita e transiciona direto ao rastreio sem "confirmar/você contratou X". | `ProposalsList.tsx:382`; walkthrough #20 `16→17` | Resumo/confirmação + SuccessSplash. | M | Alto | aberto |
| PROP-02 | PROP | Alto | QnA assimétrico (cliente não pergunta) | Só o prestador pergunta; QnA só aparece pós-proposta, travando o pré-lance do cliente. | `ProposalsList.tsx:67-79`; `QnaThread.tsx` | Canal simétrico (cliente pergunta, mesmo componente). | M | Médio | aberto |
| PROP-03 | PROP/CONS | Alto | Dois mecanismos para aceitar proposta na mesma tela | 1ª proposta usa SlideToConfirm; demais usam botão "Aceitar" (tap). Mesma ação, dois controles. | walkthrough #8 `16-proposal-scroll.png` | Padronizar um único controle de aceite. | P | Médio | ✔ feito (`41ade70`) |
| EXC-02 | EXC | Alto | 6 telas de exceção fragmentadas com padrões repetidos | Grupo A (decidir) e Grupo B (abrir caso) reimplementam ~80% da estrutura; entram por cards inline que só empurram para a rota. | `surcharge/requote/reschedule/dispute/warranty/no-show.tsx` | Grupo A → sheets inline; Grupo B → `ClaimForm` único. | G | Alto | aberto |
| ASSET-02 | ASSET | Alto | assets/new exige nickname obrigatório no modo picker | Para desbloquear pedido de guincho o usuário é forçado a "batizar o carro" (≥2 chars). | `assets/new.tsx:156-160` | Tornar nickname opcional no fluxo picker. | P | Médio | aberto |
| PROF-01 | PROF | Alto | Perfil sem editar dados nem excluir conta | Não edita nome/e-mail/telefone/foto/senha; sem excluir conta (exigência de loja); card de identidade não é tocável. | `profile.tsx` (ausência); walkthrough #17 `21-profile.png` | Tela de editar perfil/senha + excluir conta + itens de conta. | G | Alto | aberto |
| PROF-02 | PROF | Alto | Logout sem confirmação | 1 toque destrói a sessão. | `profile.tsx:71` | Diálogo de confirmação. | P | Médio | ✔ feito (`41ade70`) |
| PROF-03 | PROF | Alto | Botões sm de tema/idioma <44dp e sem estado selected | Altura 38dp (<44); ativos não expõem `accessibilityState={{selected}}`. Falha 2.5.8/4.1.2. | `profile.tsx:44-67`; `Button.tsx:37` | Alvo ≥44dp + `selected` exposto. | P | Médio | ✔ feito (`c4a4a9c`) |
| DS-02 | DS | Alto | `<Sheet>` ausente → 6+ reimplementações idênticas | Modal+backdrop+grab handle copy-pasteado (comentário verbatim em 6 arquivos); paddings e a11y divergentes. | `DictationModal.tsx:104`; `RequestFilterSheet.tsx:51`; `RecordKmSheet.tsx:63`; `SinglePicker.tsx:43`; `LinkedPicker.tsx:86`; `DatePicker.tsx:88` | Extrair `<Sheet>` compartilhado (a11y+insets+animação). | M | Alto | aberto |
| DS-03 | DS | Alto | Sem escala de spacing em tokens | Números mágicos de espaçamento (12/13/14/16/18/20...) hardcoded; gap de "linha" diverge (13 vs 12). | `themes.ts:44`; `primitives.tsx:125,142,161,174` | `theme.space` 4-pt + `radius.sheet`; migrar Row/Screen/Card. | M | Médio | aberto |
| DS-04 | DS | Alto | Tipografia inline fora de `<Text variant>` | fontSize/fontWeight cru (12.5/13.5/14.5...) fura a escala tipográfica. | `primitives.tsx:129,149,162,213,236`; `Wiz.tsx:53,55,68`; `notifications.tsx:78` | Ampliar `Variant`; lint proibindo fontSize literal. | M | Médio | aberto |
| DS-07 | DS/A11Y | Alto | `Toggle` é visual-only (sem role de switch) | Sem `onValueChange`/`Pressable`/`accessibilityRole="switch"`; usado no shareNote do pedido. | `primitives.tsx:282-289`; `new.tsx:303` | Componente Switch real com role/state. | M | Médio | aberto |
| A11Y-03 | A11Y | Alto | `Stars` sem nome/valor | Interativo e read-only sem role/label; TalkBack anuncia só o glifo "★". Falha 4.1.2. | `Stars.tsx:24-31` | `role="adjustable"` + `accessibilityValue` + label por estrela. | P | Alto | ✔ feito (`c4a4a9c`) |
| A11Y-04 | A11Y | Alto | Textos-como-botão sem role e alvo <44px | `Text onPress` sem `accessibilityRole="button"`, sem hitSlop, <24/44px. Espalhado (auth + lifecycle). Falha 2.5.8/4.1.2. | `welcome.tsx:189`; `login.tsx:96`; `register.tsx:62`; `verify.tsx:78`; `index.tsx:469`; `ProposalsList.tsx:387-392`; `ReviewForm.tsx:89` | Trocar por Button/Pressable com role + alvo ≥44dp. | M | Alto | ◐ parcial — roles nas propostas e no cancelar; welcome/login/register/verify seguem |
| A11Y-05 | A11Y | Alto | AssetSelector/cards sem role/selected | Seleção comunicada só por cor de borda + check; sem `accessibilityState={{selected}}`. | `AssetSelector.tsx:44,57` | Role + label + estado selected. | P | Médio | aberto |
| GLOB-02 | GLOB | Alto | Erro de query sem UI/retry; sem Toast/ErrorBoundary | `PaginatedList` nem expõe `isError`; erros via `Alert.alert` (window.alert no web); sem ErrorBoundary global. | `PaginatedList.tsx:33-41`; `client.ts:152-156` | `isError`/`refetch` + `<ErrorState>` + `<Toast>` + ErrorBoundary. | M | Alto | aberto |
| CONS-01 | CONS | Alto | Moeda quebrada no card de proposta | Preço renderiza `R$ 103.2` (ponto en-US, sem centavos) enquanto outras telas mostram `R$ 103,20`. | walkthrough #1 `15,16` vs `14,23` | Corrigir formatter de preço da proposta. | P | Alto | ✔ feito (`c4a4a9c`) |
| CONS-02 | CONS | Alto | i18n misturado nas notificações | "New question from a pro" (inglês) convive com strings pt-BR; string hardcoded não traduzida. | walkthrough #2 `23-notifications.png` | Traduzir/mover string para i18n. | P | Médio | ✔ feito (`8a5aad2`) |
| AR-01 | AR | Alto | Telas de medição/AR acessíveis sem autenticação | `exempt = medicao \| ar-medicao` no gate; telas de POC abertas sem login em produção. | `_layout.tsx:79` | Remover exempt em produção ou gatear. | P | Médio | ✔ feito (`2ea172a`) |
| AUTH-09 | AUTH | Médio | "Pular" vai para register + `<Text>` vazio clicável | "Pular" onboarding leva a cadastro; no último slide um Text vazio com onPress+flex:1 vira alvo invisível. | `welcome.tsx:179-184` | "Pular"→home/guest; remover alvo fantasma. | P | Médio | aberto |
| AUTH-10 | AUTH | Médio | GoogleButton sem role; botão visível quando indisponível | `Pressable` sem role/state; botão aparece mesmo sem webClientId → beco de erro. | `GoogleButton.tsx:11-15`; `useGoogleSignIn.ts:50-52` | Role/state + esconder quando não configurado. | P | Médio | aberto |
| AUTH-11 | AUTH | Médio | Telefone sem máscara/validação; '55' hardcoded | Aceita qualquer coisa; `'55'+digits` fixo; sem `autoComplete="tel"`. | `login.tsx:31,72`; `register.tsx:49` | Máscara + validação + autofill de telefone. | M | Médio | aberto |
| AUTH-12 | AUTH | Médio | Sem toggle mostrar senha; política mín. 6 fraca | `secureTextEntry` puro, sem medidor de força nem confirmar senha. | `login.tsx:76`; `register.tsx:50` | Toggle mostrar + política ≥8 com feedback. | P | Médio | aberto |
| AUTH-13 | AUTH | Médio | Reenvio de OTP sem feedback | `resend()` só reseta o timer; nenhum toast "código reenviado". | `verify.tsx:45-55` | Toast/feedback de reenvio. | P | Baixo | ✔ feito (`41ade70`) |
| AUTH-14 | AUTH | Médio | `slides[i]` sem guarda (crash se i18n parcial) | Acesso a `slides[i].title` sem proteção; welcome quebra se tradução vier incompleta. | `welcome.tsx:176` | Filtrar chaves faltando (como FirstAssetTutorial). | P | Médio | aberto |
| AUTH-15 | AUTH | Médio | Sem KeyboardAvoidingView; teclado cobre campos | Login `scroll=false` sem KAV; textarea de descrição fica encoberta ao focar. | `login.tsx:51,93`; walkthrough #6 `03,04` | KeyboardAvoidingView + rolagem. | P | Médio | ◐ parcial — KeyboardAvoidingView no wizard; login.tsx segue sem |
| AUTH-16 | AUTH | Médio | Assimetria register(só-email) ↔ login OTP | Quem se cadastra só com e-mail não consegue login por telefone; nada avisa. | `register.tsx:24`; `login.tsx:30-33` | Definir e comunicar a simetria (OTP por e-mail ou tel obrigatório). | M | Médio | aberto |
| HOME-03 | HOME | Médio | Categorias sem busca/filtro | Sem campo de busca; persona sabe o que precisa mas rola seções. | `categories.tsx` | Campo de busca no topo. | P | Médio | aberto |
| HOME-04 | HOME | Médio | Categorias sem estado de erro | Se `useCategories` falha, tela em branco. | `categories.tsx` | Empty/error states. | P | Baixo | aberto |
| NAV-02 | NAV | Médio | Drawer redundante com 3 superfícies | "Meu perfil/pedidos/ativos" duplicam abas/Home; "Pedir serviço" escondido no hambúrguer. | walkthrough #15 `19-drawer.png` | Enxugar drawer; promover "Pedir". | M | Médio | aberto |
| REQ-09 | REQ | Médio | Slide-to-confirm no fim de funil urgente | Confirmação por gesto ao fim de 7 telas para pedido urgente = fricção sobre fricção. | `new.tsx:38`; walkthrough #12 | Simplificar confirmação no modo expresso. | M | Médio | aberto |
| REQ-10 | REQ | Médio | Filtro client-side na lista de pedidos (contagem engana) | `filteredCount` conta só o que já foi paginado. | `requests.tsx:36-40` | Filtro server-side. | M | Médio | aberto |
| REQ-11 | REQ | Médio | Avaliação em três superfícies + modal renasce (nag) | ReviewForm no modal (reabre a cada foco, reseta a reload), inline e rota dedicada. | `index.tsx:144,220,577`; `rate.tsx` | Uma superfície; rota só p/ notificação; matar o nag. | M | Médio | aberto |
| REQ-12 | REQ | Médio | Duplicação de peças/valor na mesma aba | Aprovação de peça inline e no painel de obra listam as mesmas peças; valor em 3 lugares. | `index.tsx:448-479` vs `:692-707`; `:387,685` | Fonte única por peça/valor. | M | Médio | aberto |
| REQ-13 | REQ | Médio | Endereço muda entre etapas | Etapa 2 "5, Jardim Marajó" vs Revisão "Rua Patrícia..., 805" — geocode reverso inconsistente. | walkthrough #7 `07` vs `12,14` | Uma fonte de endereço/geocode. | M | Médio | aberto |
| REQ-14 | REQ | Médio | Sem momento de sucesso ao enviar o pedido | Após o slide cai direto no detalhe "Aberto" sem celebração; pico de esforço sem recompensa. | walkthrough #19 `12→13` | SuccessSplash pós-envio. | P | Médio | ✔ feito (`41ade70`) |
| REQ-15 | REQ | Médio | start_code permanece após o início do serviço | Card gigante (30px) fica visível durante InProgress, quando o código já cumpriu função. | `index.tsx:441-447` | Colapsar em chip que some após `started_at`. | P | Baixo | aberto |
| REQ-16 | REQ | Médio | Sem confirmação de conclusão pelo cliente | Existe start-code p/ iniciar, mas cliente nunca confirma término/libera pagamento; settlement aparece pronto. | `index.tsx:558`; `ReceiptView.tsx` | Decisão de produto: controle/escrow de conclusão. | M | Médio | aberto |
| PROP-04 | PROP | Médio | Contraproposta é rodada única, sem recontra | Vira `pending_counter_offer` e o botão some; cliente só aceita/recusa, não recontrapropõe. | `ProposalsList.tsx:353,390` | Ao menos 2ª rodada de negociação. | M | Médio | aberto |
| PROP-05 | PROP | Médio | Dados do ativo não repassados ao prestador | Prestador pergunta marca/modelo que já estão no ativo cadastrado. | walkthrough #4 `15,16` | Repassar dados do ativo à proposta/QnA. | M | Médio | aberto |
| PROP-06 | PROP | Médio | Provider novo parece nota zero | "0.0 · 0 serviços" com 5 estrelas vazias sugere avaliação péssima em vez de "Novo". | walkthrough #10 `16` | Rótulo "Novo"/"Sem avaliações". | P | Médio | ✔ feito (`41ade70`) |
| EXC-03 | EXC | Médio | Loop de navegação surcharge↔requote | `tier==='requote'` redireciona entre duas telas que dizem quase o mesmo. | `surcharge.tsx:38,121-124` | Um único destino de "mudança de preço". | M | Médio | aberto |
| EXC-04 | EXC | Médio | Feedback de sucesso inconsistente entre exceções | surcharge e no-show-"esperar" dão `router.back()` mudo; requote/dispute dão `Alert`. | `surcharge.tsx:31`; `no-show.tsx:44` | Feedback uniforme (toast/splash) em todo sucesso. | P | Médio | ✔ feito (`41ade70`) |
| EXC-05 | EXC | Médio | Duplicação dispute/warranty; dispute não remove foto | Mesmo formulário com rótulos diferentes; no dispute não dá para remover foto adicionada por engano. | `dispute.tsx:62-81,73`; `warranty.tsx:102-159,131` | `ClaimForm` único parametrizado. | M | Médio | aberto |
| NOTIF-01 | NOTIF | Médio | Anel pulsante perpétuo no badge do sino | `Animated.loop` infinito enquanto houver não-lida; ruído/ansiedade + bateria. | `primitives.tsx:51-59` | Pulsar só na chegada e parar. | P | Baixo | aberto |
| NOTIF-02 | NOTIF | Médio | Spam de notificações sem agrupamento; badge 99+ perpétuo | Cada proposta/pergunta = aviso separado; 1 pedido com 5 propostas ~10 avisos. | walkthrough #18 `23,00b`; `notifications.tsx` | Agrupar/colapsar por pedido/tipo. | M | Médio | aberto |
| NOTIF-03 | NOTIF | Médio | Realtime não reconecta em troca de token | Socket singleton usa token do momento da conexão; após refresh segue com o antigo. | `echo.ts:24,66` | Reassinar socket no refresh de token. | M | Médio | aberto |
| DS-05 | DS | Médio | Card gradiente CTA duplicado | `home.tsx` e `HomeAssets.tsx` quase idênticos (Pressable→LinearGradient→texto+ícone 46×46). | `home.tsx:182-197`; `HomeAssets.tsx:154-174` | Extrair `<GradientCTACard>`. | P | Baixo | aberto |
| DS-06 | DS | Médio | 3× SelectField reimplementado | "Campo clicável" (surface2+border+minHeight50+ícone) copiado em 3 lugares. | `LinkedPicker.tsx:129`; `primitives.tsx:231`; `DatePicker.tsx:80` | Extrair `<SelectField>`. | M | Baixo | aberto |
| A11Y-06 | A11Y | Médio | Segment/chips comunicam seleção só por cor | `Segment` (urgência/acesso/pagamento) e chips de DynamicFields sem `accessibilityState`. Falha 1.4.1/4.1.2. | `DynamicFields.tsx:63`; `new.tsx` | `accessibilityState={{selected}}` + role. | P | Médio | aberto |
| A11Y-07 | A11Y | Médio | Erros de campo não anunciados | `Field`/`AuthField` mostram erro visual sem `aria-describedby`/`accessibilityLiveRegion`/`aria-invalid`. Falha 3.3.1/4.1.3. | `AuthField.tsx:42`; `Field.tsx:88-90` | Associar erro ao input + live region. | P | Médio | aberto |
| A11Y-08 | A11Y | Médio | Focus ring só web e incompleto | `focusRing` só no web e ausente em sheets/PickerField/BackBar/Wiz/"marcar todas". Falha 2.4.7/2.4.11. | `a11y.ts:9-13`; §4.2 | Aplicar focusRing em todos os Pressable. | M | Baixo | aberto |
| A11Y-09 | A11Y | Médio | Labels de ícone em inglês; BackBar/Wiz sem role | `IconButton` usa nome do ícone como label ("bell","menu"); BackBar/Wiz back sem role/label. Falha 4.1.2. | `primitives.tsx:32,143-147`; `Wiz.tsx:50,83` | Labels i18n + role em navegação. | P | Médio | aberto |
| A11Y-10 | A11Y | Médio | Alvos de toque abaixo do recomendado | "marcar todas" ~29px; fechar sheet ~38px; remover foto 24px; navBtn DatePicker 30px sem hitSlop. | `notifications.tsx:39`; `new.tsx:437`; `DatePicker.tsx:72`; `index.tsx:534` | hitSlop/tamanho ≥44dp. | P | Médio | aberto |
| A11Y-11 | A11Y | Médio | OtpInput sem accessibilityLabel/estado de erro | Input escondido (1×1px) sem label; 6 Views lidas soltas; borda não muda no erro. Falha 1.3.1/4.1.2. | `OtpInput.tsx:47-57` | Label no input + `liveRegion` + borda de erro. | P | Médio | aberto |
| A11Y-12 | A11Y | Médio | Card onPress sem accessibilityRole | Cards clicáveis (notificações, RequestCard, "Meus ativos") não se anunciam como botão. | `Card.tsx:26`; `RequestCard.tsx:26` | Role/label agregado no Card clicável. | P | Médio | aberto |
| GLOB-04 | GLOB | Médio | Skeleton vs spinner sem regra | Algumas listas usam skeleton, outras `ActivityIndicator`; percepção de performance inconsistente. | `PaginatedList.tsx:103-104` vs `dashboard.tsx:141` | Regra: skeleton p/ 1º load; spinner p/ ação pontual. | P | Baixo | aberto |
| PERF-01 | PERF | Médio | Estilos inline sem StyleSheet em ~23 componentes | Objetos recriados a cada render; só Text/Button usam `StyleSheet.create`. | `ui/*` | `StyleSheet.create` para partes estáticas. | M | Baixo | aberto |
| CONS-03 | CONS | Médio | ETA inconsistente entre superfícies | Card mostra `1h4` (truncado), notificações `64 min`, rastreio `~16 min`. | walkthrough #3 `16,23,17` | Formatter único de ETA. | P | Médio | ✔ feito (`da0590a`) |
| CONS-04 | CONS | Médio | Status todos verdes na lista | "Aceito", "Em atendimento" e "Concluído" usam o mesmo verde; não dá para distinguir de relance. | walkthrough #9 `20-requests-list.png` | Cores distintas por estado (+ ícone/texto). | P | Médio | ✔ feito (`c4a4a9c`) |
| CONS-07 | CONS | Médio | Perguntas do QnA em inglês em app pt-BR | "Is the transmission automatic or manual?" no seed; texto não localizado. | walkthrough #4 `15,16` | Localizar strings/dados do QnA. | P | Baixo | aberto |
| AUTH-17 | AUTH | Baixo | Default de `mode` diverge dev/prod | Login abre em e-mail no dev e telefone no prod; dev testa caminho diferente do usuário. | `login.tsx:17` | Igualar/documentar o default. | P | Baixo | aberto |
| REQ-17 | REQ | Baixo | Card de contexto redundante no detalhe | Categoria/endereço/urgência repetidos no BackBar, JobSubject e DetailRow. | `index.tsx:329-348,357` | Fundir contexto com o header. | P | Baixo | aberto |
| REQ-18 | REQ | Baixo | Redirects montam um frame React | `proposals.tsx`/`track.tsx` piscam antes de redirecionar. | `proposals.tsx`; `track.tsx` | Rewrite no roteador. | P | Baixo | ✔ feito (`2ea172a`) |
| REQ-19 | REQ | Baixo | receipt.tsx é alias não documentado | Recibo existe inline e como rota (destino de notificação). | `receipt.tsx`; `index.tsx:558` | Documentar como alias intencional. | P | Baixo | ✔ feito (`2ea172a`) |
| EXC-06 | EXC | Baixo | Emoji como ícone no no-show | 🕒 fonte 40 em vez do sistema de ícones. | `no-show.tsx:39` | Usar o sistema de ícones. | P | Baixo | aberto |
| EXC-07 | EXC | Baixo | CTA não-fixo no reschedule | Botão "enviar" rola com o conteúdo, inconsistente com as outras exceções. | `reschedule.tsx:80` | Fixar o footer. | P | Baixo | aberto |
| NOTIF-04 | NOTIF | Baixo | Chime: rate-limit não compartilhado entre instâncias | `MIN_GAP_MS` global por instância; dois listeners não compartilham. | `useNotificationChime.ts:22,45-46` | Rate-limit compartilhado. | P | Baixo | aberto |
| NOTIF-05 | NOTIF | Baixo | Sem badge no ícone do launcher | `shouldSetBadge:false`; contagem só vive dentro do app. | `push.ts:52` | Avaliar setar badge no ícone. | P | Baixo | aberto |
| PROF-04 | PROF | Baixo | Perfil não expõe paletas trust/night | Temas existem mas só light/dark/auto são acessíveis. | `profile.tsx:44`; `themes.ts` | Expor seleção de paleta. | P | Baixo | aberto |
| PROF-05 | PROF | Baixo | Troca de idioma não sincroniza setApiLocale | `changeLanguage`+`persistLanguage` sem atualizar o locale do backend. | `profile.tsx:62-65` | Chamar `setApiLocale` na troca. | P | Baixo | aberto |
| DS-08 | DS | Baixo | `headWeight` hardcoded quebra o trust theme | Primitives usam `'800'`/`'700'` cru em vez de `t.headWeight`. | `primitives.tsx:162,166,213` | Consumir `t.headWeight`. | P | Baixo | aberto |
| DS-09 | DS | Baixo | `radius.btn` hardcoded como 999 | `borderRadius:999` cru em Badge/Chip/SuggPill em vez de `t.radius.btn`. | `Badge.tsx:27`; `Chip.tsx:26`; `primitives.tsx:295` | Usar `t.radius.btn`. | P | Baixo | aberto |
| DS-10 | DS | Baixo | Ícone de tipo de asset duplicado | Map `ICON` redefinido localmente além de `assetDisplay`. | `[id]/index.tsx:30` | Fonte única em `assetDisplay`. | P | Baixo | aberto |
| A11Y-13 | A11Y | Baixo | DividerOr/BrandMark sem tratamento decorativo | "ou" e logo lidos como ruído; sem `accessibilityElementsHidden`/label. | `DividerOr.tsx`; `BrandMark.tsx` | Marcar decorativo / dar label. | P | Baixo | aberto |
| A11Y-14 | A11Y | Baixo | Dots de não-lida/status são cor-apenas | Dot de unread e `Badge dot` sem alternativa textual. Falha 1.4.1. | `notifications.tsx:92`; `primitives.tsx` (Badge dot) | Texto alternativo / rótulo. | P | Baixo | aberto |
| PERF-02 | PERF | Baixo | Código morto `stepOf` na home | Retorna 3 tanto p/ ativo quanto p/ terminal; enganoso. | `home.tsx:40-44` | Remover código morto. | P | Baixo | ✔ feito (`2ea172a`) |
| CONS-05 | CONS | Baixo | Pluralização "(s)" literal na UI | "5 proposta(s)", "0 foto(s)" aparecem literalmente. | walkthrough #11 `20,12` | Pluralização por i18n. | P | Baixo | ✔ feito (`41ade70`) |
| CONS-06 | CONS | Baixo | i18n com chaves mortas | Labels de campo e `createAccount` definidos mas nunca renderizados. | `pt-BR.json:98,107,109,132-139` | Limpar/usar as chaves. | P | Baixo | ✔ feito (`da0590a`) |
| PROP-07 | PROP | Baixo | Ordenação visível com 0 propostas | Sort Preço/Tempo/Nota renderizado no estado vazio. | walkthrough `13` | Renderizar o sort só quando `proposals.length > 0`. | P | Baixo | ✔ feito (`41ade70`) |
| REQ-20 | REQ | Médio | "Cancelar chamado" com contraste baixo e sem role | Link destrutivo em cinza de baixo contraste, sem `accessibilityRole`. | walkthrough `13` | Cor `danger` legível + role de botão. | P | Médio | ✔ feito (`41ade70`) |
| NOTIF-06 | NOTIF | Crítico | Push silencioso chegava como notificação do FCM | `ExpoChannel` mandava `channelId` no data message; o Expo converte qualquer indício de alerta em notificação FCM — Android desenhava card vazio em `fcm_fallback_notification_channel` e a task de background nunca acordava. | `ExpoChannel.php:45-61` | Não enviar `channelId`/título/corpo no sync silencioso. | P | Alto | ✔ feito (`b7d01a5`) |
| NOTIF-07 | NOTIF | Crítico | Task de background nunca executava o corpo | No Android o payload real vem como **string JSON** em `data.dataString`; `extractData` devolvia o envelope do Expo, então `type` era `undefined` e o handler retornava na 1ª linha. O log imprimia "Finished task" mesmo assim, mascarando o bug. | `activeRequestBackgroundTask.ts:18-22` | Parsear `dataString`/`body` antes de ler os campos. | P | Alto | ✔ feito (`b7d01a5`) |
| NOTIF-08 | NOTIF | Alto | Handlers registrados fora do entry point | `TaskManager.defineTask` e `notifee.onBackgroundEvent` só rodavam quando `_layout` importava; num start headless nada sob `app/` é avaliado, então o evento era descartado ("No task registered for key app.notifee.notification-event"). | `index.js` (ausente antes) | Registrar ambos no entry point (`main` → `index.js`). | P | Alto | ✔ feito (`c67a079`, `b7d01a5`) |
| NOTIF-09 | NOTIF | Alto | Sync do tracker só cobria 2 das 10 transições | O push de sync era um `notify()` solto dentro de `updateStatus` (in_progress/completed); aceitar proposta, cancelar, no-show, requote, reagendar e expirar deixavam a notificação desatualizada com o app fechado. | `RequestService.php:274-278` | Listener em `RequestStatusUpdated`, que todas as transições já disparam. | M | Alto | ✔ feito (`b7d01a5`) |
| NOTIF-10 | NOTIF | Médio | `ongoing` não é persistente no Android 14 | Desde a API 34 o usuário desliza a notificação para fora — e um foreground service **não** resolveria (a notificação dele também é dispensável). Verificado no aparelho. | `activeRequestNotification.ts` | Repor após dispensa, com orçamento de 3 reposições por estágio. | M | Médio | ✔ feito (`c67a079`, `89ced23`) |

---

## Top 15 por (Impacto ÷ Esforço)

Maior alavancagem — muito impacto com pouco esforço (Impacto Alto + Esforço P primeiro):

1. **AUTH-01** — Gate do EnvSwitch em `__DEV__` (P, Alto): elimina um Crítico de segurança em ~2 linhas.
2. **AUTH-03** — Remover `API: <host>` do erro de login (P, Médio/Alto): outro Crítico em 1 linha.
3. **CONS-01** — Corrigir formatter de moeda da proposta (P, Alto): bug visível de confiança financeira.
4. **A11Y-03** — Rotular `Stars` com role/value (P, Alto): desbloqueia leitura de avaliação.
5. **REQ-05** — Mensagem inline no "Continuar" desabilitado (P, Alto): destrava usuário travado no funil.
6. **AUTH-05** — Autofill/textContentType nos campos (P, Alto): reduz fricção de login/cadastro.
7. **CONS-02** — Traduzir string "New question from a pro" (P, Médio): corrige quebra de i18n.
8. **PROF-02** — Confirmação no logout (P, Médio): previne perda acidental de sessão.
9. **A11Y-07** — Associar erro ao input + live region (P, Médio): conserta todos os formulários de uma vez.
10. **A11Y-04** — Role + alvo ≥44dp nos textos-como-botão (M, Alto): a11y transversal em auth e ciclo de vida.
11. **A11Y-01** — SlideToConfirm acessível + botão alternativo (M, Alto): desbloqueia aceitar proposta/aprovar cobrança para leitor de tela.
12. **A11Y-02** — BudgetMeter acessível (M, Alto): destrava definição de orçamento.
13. **DS-01** — Escurecer accent / tokens de texto escuros (M, Alto): conserta contraste sistêmico em todo o app.
14. **EXC-01** — Date picker nativo no reschedule (M, Alto): elimina erro de formato garantido.
15. **REQ-01** — Tornar veículo opcional (placa inline) no pedido (M, Alto): remove o maior bloqueio de conversão do funil.
