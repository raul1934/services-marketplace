# Chama Fácil — App Customer · Mapa de Módulos

Marketplace de serviços sob demanda (guincho / bateria / encanador / limpeza).
React Native + Expo Router (rotas file-based). Pacote compartilhado: `@chamafacil/shared` (`packages/shared/src`).
Data: 2026-07-20 · Idioma: pt-BR · Fontes: 4 relatórios de cluster + walkthrough dinâmico no device.

> Este documento é o índice funcional do app. O inventário tela a tela está em `screens.md`; o mapa de navegação e a IA proposta em `navigation-map.md`.

---

## Tabela-resumo dos módulos

| # | Módulo | Telas/Rotas | Papel no produto | Veredito geral | Pior achado |
|---|--------|-------------|------------------|----------------|-------------|
| 1 | Autenticação | 4 (welcome, login, register, verify) | Entrada de sessão (OTP / e-mail-senha / Google) | Ajustar | EnvSwitch DEV/PROD em produção; sem "esqueci a senha" (Crítico) |
| 2 | Onboarding / Gating | Gate (`_layout`), `index`, welcome, FirstAssetTutorial | Roteamento por auth + 1ª experiência | Redesenhar | Onboarding empurra cadastro de patrimônio, não "pedir" (Crítico) |
| 3 | Home / Descoberta | `home`, `categories`, tabs `_layout` | Hub de conversão | Redesenhar | CTA primário no fim do scroll; sem ação "Pedir" persistente (Crítico) |
| 4 | Serviços / Pedidos | `request/new`, `request/[id]` (+3 abas), 2 redirects | Criação → acompanhamento | Redesenhar (criação) / Ajustar (detalhe) | Wizard de 7 etapas; asset obrigatório bloqueia pedido (Crítico) |
| 5 | Assets | `assets/index`, `new`, `[id]`, `[id]/edit`, `[id]/setup` | CRM de patrimônio (acelerador de pedido) | Manter (bem construído) / Ajustar (como pedágio) | Vira pré-requisito bloqueante do pedido (Crítico contextual) |
| 6 | Propostas & QnA | Componentes em `request/[id]` (ProposalsList, QnaThread, CounterOfferSheet) | Negociação cliente↔prestador | Ajustar | QnA assimétrico (cliente não pergunta); moeda quebrada no card (Alto) |
| 7 | Exceções | 6 rotas: dispute, warranty, requote, surcharge, reschedule, no-show | Desvios do caminho feliz | Redesenhar / consolidar | Campo de data ISO textual (Crítico); loop surcharge↔requote |
| 8 | Recibo & Avaliação | `receipt`, `rate` (+ inline no detalhe) | Fechamento + reputação | Ajustar | 3 superfícies para avaliar; modal renasce a cada foco (nag) |
| 9 | Notificações & Realtime | `notifications` + camada echo/push/chime | Awareness ao vivo | Ajustar | i18n misturado (EN/PT); badge "99+" com anel perpétuo |
| 10 | Perfil / Config | `profile` | Identidade + preferências | Redesenhar (expandir) | Beco sem saída: não edita nada, sem excluir conta (Alto/bloqueio de loja) |
| 11 | Medição AR | `medicao`, `ar-medicao` | POC de medição de imóvel | Manter (POC) | Acessível **sem auth** (superfície de risco em produção) |
| 12 | Estados Globais | Sem rota (transversal) | Loading / erro / offline / conectividade | Redesenhar | Zero detecção de offline (NetInfo não usado) — Crítico |
| 13 | Design System | `packages/shared/src/ui` + `theme` | Base visual/comportamental | Ajustar (sólido, com dívidas) | Contraste AA reprovado sistemicamente; `<Sheet>` reimplementado 6× |

---

## 1. Autenticação

- **Objetivo:** autenticar o cliente por telefone (OTP SMS), e-mail+senha, ou Google, e criar conta.
- **Telas:** `welcome` (onboarding 3 slides), `login`, `register`, `verify` (OTP 6 dígitos).
- **Rotas:** `/(auth)/welcome`, `/(auth)/login`, `/(auth)/register`, `/(auth)/verify` (grupo `(auth)` não aparece na URL). Layout: `(auth)/_layout.tsx`.
- **Componentes principais:** `AuthField`, `OtpInput`, `GoogleButton`, `DividerOr`, `BrandMark`, `Segment` (tabs Telefone/E-mail), `Button`, `EnvSwitch` (débito), `AuthProvider`, `useGoogleSignIn`.
- **Fluxos principais:** welcome → register/login; login telefone → `requestOtp` → verify → token; login e-mail/senha → token; Google → `social('google', token)`; adoção de token → `status=authed` → home.
- **Dependências:** `AuthProvider.tsx` (role `client`), `api/client.ts` (401 → logout global), i18n.
- **Observações:**
  - **Crítico:** `EnvSwitch` DEV/PROD visível em telas pré-login num app em produção (`welcome.tsx:159`, `login.tsx:54`), sem gate `__DEV__`.
  - **Crítico:** não existe recuperação de senha em lugar nenhum.
  - **Crítico:** erro de login imprime `API: <host do backend>` ao usuário (`login.tsx:83`).
  - **Crítico:** `AuthField` é placeholder-como-label + contraste `ink3` (~2.6:1); sem autofill/`textContentType` em nenhum campo.
  - Assimetria: quem se cadastra só com e-mail não consegue login por OTP (telefone). Sem verificação de e-mail. Termos/Privacidade como texto não clicável (`register.tsx:60`).
  - 401 transitório = logout silencioso sem refresh token (`client.ts:165` → `AuthProvider.tsx:50-54`).

## 2. Onboarding / Gating

- **Objetivo:** decidir para onde o usuário vai conforme o status de auth, e conduzir a 1ª experiência.
- **Telas/Rotas:** Gate em `app/_layout.tsx` (não é rota visível); `index.tsx` (`/` → redirect `/(tabs)/home`); `welcome` (slides); modal `FirstAssetTutorial`; estado vazio `FirstAssetEmpty` em `HomeAssets`.
- **Componentes principais:** `Gate` (`_layout.tsx:30-93`), `SplashBrand`, `FirstAssetTutorial`, `HomeAssets`.
- **Fluxos principais:** `loading` → SplashBrand; `guest` fora de `(auth)` → redirect `/(auth)/welcome`; `authed` em `(auth)` → redirect `/(tabs)/home`. Primeira visita sem assets → abre modal full-screen de tutorial de patrimônio.
- **Dependências:** `useAuth`, `useSegments`, `useRealtimeNotifications`, `usePushSync`, `useNotificationChime`, `loadEnv`.
- **Observações:**
  - **Crítico:** onboarding do zero (`HomeAssets.tsx:55` → `FirstAssetTutorial`) empurra `/assets/new?guided=1` como primeira ação — cadastro de patrimônio antes de pedir. Para a persona "aflito na estrada", é o pior cenário.
  - `exempt = medicao | ar-medicao` (`_layout.tsx:79`): telas de POC acessíveis **sem autenticação**.
  - Redirects em `useEffect` → possível flash de 1 frame da tela "errada".
  - "Pular" no welcome leva a `register` (semanticamente errado); `<Text>` vazio ainda clicável no último slide (`welcome.tsx:179-181`).

## 3. Home / Descoberta

- **Objetivo:** responder em <2s "como peço ajuda agora?"; catálogo quando o atalho não cobre.
- **Telas:** `home` (hub), `categories` (catálogo completo). Layout de abas: `(tabs)/_layout.tsx` (3 abas: Início, Chamados, Perfil).
- **Rotas:** `/(tabs)/home`, `/categories`.
- **Componentes principais:** `AppBar`, `AppDrawer` (drawer overlay), `HomeAssets` (rail de patrimônio), `CatTile`, `RequestCard`, card gradiente "Precisa de ajuda agora?", `SkeletonList`/`SkeletonTiles`, `Card` (grid de categorias).
- **Fluxos principais:** tile "Ajuda rápida" → `/request/new` (direto); card gradiente → `/categories` (hop extra); categoria → `/request/new?categoryId`. Drawer → perfil/ativos/pedidos/novo pedido.
- **Dependências:** `useCategories`, `useRequests`, `QUICK_HELP_SLUGS` (guincho/bateria/encanador/limpeza).
- **Observações:**
  - **Crítico:** tab-bar não tem ação "Pedir"/"+". A ação de maior valor vive no scroll da Home. Se estiver em Chamados/Perfil, precisa voltar e rolar.
  - **Alto:** hierarquia invertida — `HomeAssets` (patrimônio, baixa frequência) no topo; CTA de pedir em 3º/4º lugar, rolando para fora da thumb-zone.
  - Inconsistência: o card que *soa* mais urgente ("Precisa de ajuda agora?") é o mais lento (leva a `/categories`, não cria pedido).
  - `/categories` sem busca nem error state.

## 4. Serviços / Pedidos (criação → acompanhamento)

- **Objetivo:** criar o pedido (conversão) e acompanhá-lo do "Aberto" ao "Concluído".
- **Telas:** `request/new` (wizard 7 etapas), `request/[id]` (tela-mãe com 3 abas: Acompanhamento / Solicitação / Histórico), redirects `proposals` e `track`.
- **Rotas:** `/request/new`, `/request/:id`, `/request/:id/proposals` (redirect), `/request/:id/track` (redirect).
- **Componentes principais:** `Wiz`, `AssetSelector`, `DynamicFields`, `BudgetMeter`, `PaymentSelector`, `SlideToConfirm`, `MiniMap`/`TrackingMap`, `TrackSteps`, `JobSubject`, `JobProgressPanel`, `ProposalsList`, `ReceiptView`, `EventFeed`, `SuccessSplash`.
- **Fluxos principais:** wizard `details → location → questions → when → photos → money → review` → slide para enviar → detalhe. Detalhe evolui por status: Aberto (propostas) → Aceito → A caminho (mapa+ETA+start-code) → Em atendimento (peças/updates) → Concluído (recibo+avaliação).
- **Dependências:** `useCategories`, GPS/`reverseGeocode`, upload de fotos, realtime (`subscribeToRequest`), `AuthProvider`.
- **Observações:**
  - **Crítico:** wizard de 7 etapas fixas (nenhuma pulada dinamicamente), ~10 interações para um chamado urgente. Sem modo expresso.
  - **Crítico:** asset obrigatório para categorias de veículo bloqueia `Continuar` até existir `assetId` (`new.tsx:212`) → força sub-wizard de cadastro no meio do pedido.
  - **Alto:** tela-mãe `[id]/index.tsx` (872 linhas) empilha até ~13 blocos condicionais na aba Acompanhamento.
  - **Bugs de runtime:** moeda `R$ 103.2` (en-US, sem centavos) no card de proposta; endereço muda entre etapas (geocode inconsistente); "Continuar" desabilitado sem explicar o quê falta; teclado cobre o campo de descrição; campo "ACESSO: adulto/código" exibido para guincho na estrada.
  - Sem momento de sucesso ao enviar (cai direto no detalhe "Aberto").

## 5. Assets (patrimônio)

- **Objetivo:** cadastrar veículo/imóvel/pet para pré-preencher pedidos e guardar histórico. **Deveria ser acelerador opcional.**
- **Telas:** `assets/index` (lista), `assets/new` (sub-wizard), `assets/[id]` (detalhe 2 abas: identidade/histórico), `assets/[id]/edit`, `assets/[id]/setup` (setup guiado de cômodos).
- **Rotas:** `/assets`, `/assets/new`, `/assets/:id`, `/assets/:id/edit`, `/assets/:id/setup`.
- **Componentes principais:** `PaginatedList`, `Wiz` (reusado do pedido), `assetDisplay` (ICON/caption), `TimelineEvent`, `SkeletonScreen`, `NotFoundView`, chips de tipo.
- **Fluxos principais:** lista → detalhe (timeline unificada requests+readings+parts) → editar/arquivar (soft-delete). Cadastro por tipo; modo picker (`?pick=1&type=vehicle`) vindo do pedido fixa tipo e auto-seleciona ao voltar.
- **Dependências:** `useAssets`, AR (`/medicao`) a partir do setup.
- **Observações:**
  - Subsistema **bem construído** (arquitetura de dados exemplar, honestidade de paginação, arquivar em vez de excluir).
  - **Crítico contextual:** vira pedágio do funil (§4) e do onboarding (§2). Mesmo no modo picker, exige nickname obrigatório (`new.tsx:156-160`) — "batizar o carro" no meio da emergência.

## 6. Propostas & QnA

- **Objetivo:** receber propostas, negociar preço (contraproposta) e responder perguntas do prestador antes de aceitar.
- **Telas/Rotas:** não tem rota própria — vive dentro de `/request/:id` (aba Acompanhamento, estado Aberto).
- **Componentes principais:** `ProposalsList` → `ProposalCard` → `QnaThread`, `CounterOfferSheet` (bottom-sheet), `AnswerList`, `Stars`, `SlideToConfirm` (aceitar melhor proposta).
- **Fluxos principais:** propostas chegam em tempo real; ordenar por preço/ETA/nota; aceitar (slide na "melhor" / botão nas demais); contraproposta 1 rodada (preço+msg); responder pergunta (texto + foto opcional/obrigatória).
- **Dependências:** realtime, `useProposals`, `useQuestions`.
- **Observações:**
  - **Alto:** QnA assimétrico — só o prestador pergunta; o cliente não tem canal para perguntar. Perguntas só aparecem de quem já propôs (sem Q&A pré-lance do lado do cliente).
  - **Alto (runtime):** dois mecanismos para a MESMA ação na MESMA tela — "melhor opção" usa slide, as demais usam botão de tap.
  - **Alto:** aceitar proposta (compromisso financeiro) sem confirmação/resumo nem feedback de sucesso.
  - Contraproposta é rodada única (sem recontrapor). Prestador "novo" aparece como "0.0 · 0 serviços" com 5 estrelas vazias (parece nota zero).

## 7. Exceções (dispute / warranty / requote / surcharge / reschedule / no-show)

- **Objetivo:** tratar desvios: sobretaxa, recotação, reagendamento, prestador não apareceu, disputa, garantia.
- **Telas/Rotas:** `/request/:id/{surcharge, requote, reschedule, no-show, dispute, warranty}`.
- **Componentes principais:** `SlideToConfirm`, `Field` (multiline + voz), grids de foto, `Segment`, timeline/stepper de status, `Alert`.
- **Fluxos principais:** **Grupo A** (decidir sobre proposta do prestador: surcharge/requote/reschedule-entrante) = card + breakdown + aprovar/recusar. **Grupo B** (abrir caso com evidências: dispute/warranty/reschedule-propor/no-show) = formulário + foto + texto.
- **Dependências:** cada uma entra por card/botão que já vive no `[id]/index.tsx`.
- **Observações:**
  - **Crítico:** `reschedule` usa campo de data como **texto ISO** (`^\d{4}-\d{2}-\d{2}$`, `reschedule.tsx:36,72`) — sem calendário, erro por formato garantido.
  - **Crítico:** `SlideToConfirm` é o único meio de aprovar cobranças — inacessível a teclado/leitor de tela (WCAG 2.5.7).
  - **Médio:** loop de navegação surcharge↔requote (`surcharge.tsx:38,121`). Feedback de sucesso inconsistente (surcharge/no-show-"esperar" mudos vs. requote/dispute com Alert). dispute e warranty são ~80% o mesmo formulário duplicado; dispute não deixa remover foto.
  - **Proposta:** Grupo A → bottom-sheet inline; Grupo B → um `ClaimForm` parametrizado. De 6 rotas para ~2 rotas + 1 sheet.

## 8. Recibo & Avaliação

- **Objetivo:** mostrar o recibo do serviço pago e coletar avaliação (estrelas + review + gorjeta).
- **Telas:** `receipt` (standalone), `rate` (standalone) — ambos também renderizam inline no detalhe.
- **Rotas:** `/request/:id/receipt`, `/request/:id/rate`.
- **Componentes principais:** `ReceiptView`, `ReviewForm`, `Stars`.
- **Fluxos principais:** conclusão → recibo inline no detalhe; avaliação por modal (reabre a foco) OU CTA inline OU rota dedicada.
- **Dependências:** destinos de notificação `payment_settled` / `review_request` (`notificationLinks.ts`).
- **Observações:**
  - **Médio:** 3 superfícies para avaliar (modal renascente + inline + rota) → risco de avaliar duas vezes/confusão. O modal reabre a cada foco e reseta a cada reload (nag; `index.tsx:144,220`).
  - **Alto (a11y):** `Stars` sem role/valor.
  - `receipt.tsx` é alias intencional para notificação — manter e documentar.
  - **Assimetria de controle:** existe start-code para iniciar, mas o cliente nunca confirma o fim/libera pagamento — a liquidação aparece pronta.

## 9. Notificações & Realtime

- **Objetivo:** manter o cliente ciente de propostas, perguntas, mudanças de status e pagamentos, em tempo real.
- **Telas:** `notifications` (lista paginada).
- **Rotas:** `/notifications`.
- **Componentes principais:** `Badge` (contagem "99+"), `notificationLinks` (deep-link map), `useRealtimeNotifications`, `useNotificationChime`, `usePushSync`, `echo` (Pusher/Echo), `EmptyState`.
- **Fluxos principais:** WebSocket invalida caches → UI atualiza + chime + haptic; tocar notificação → marca lida + deep-link para a rota alvo; push em background → abre o request.
- **Dependências:** `echo.ts` (singleton), `push.ts`, React Query cache invalidation no Gate.
- **Observações:**
  - **Alto (runtime):** i18n misturado — "New question from a pro" (EN) ao lado de strings pt-BR.
  - **Médio:** ETA em 3 formatos entre superfícies (`1h4` / `64 min` / `~16 min`). Sem agrupamento por pedido (1 pedido com 5 propostas ~ 10 avisos). Badge "99+" com anel pulsante **perpétuo** (ruído + bateria).
  - **Médio (débito):** `echo` não reconecta o socket após refresh de token. Deep-link map (`notificationLinks.ts`) é o melhor arquivo do cluster (aditivo, fallback gracioso).

## 10. Perfil / Config

- **Objetivo:** identidade + acesso a ativos + preferências (tema/idioma) + logout.
- **Telas:** `profile`.
- **Rotas:** `/(tabs)/profile`.
- **Componentes principais:** `Card` de identidade, `Avatar`, `Button` (tema/idioma), `Row`, `Icon`.
- **Fluxos principais:** ver identidade → tocar "Meus ativos" → `/assets`; trocar tema (light/dark/auto) e idioma (PT/EN); Sair.
- **Dependências:** `i18n.changeLanguage`, `persistLanguage`, `ThemeProvider`.
- **Observações:**
  - **Alto:** beco sem saída — não edita nome/e-mail/telefone/foto/senha, sem pagamentos, sem endereços, sem preferências de notificação, **sem excluir conta** (bloqueio de publicação App Store/Play). Card de identidade parece tocável mas não é.
  - **Alto:** logout em 1 toque, sem confirmação (`profile.tsx:71`).
  - Botões de tema/idioma `size="sm"` (38dp < 44dp) e sem `accessibilityState.selected`. Paletas `trust`/`night` existem no tema mas o perfil só expõe light/dark/auto.

## 11. Medição AR

- **Objetivo:** POC de medição de imóvel (área/cômodos/360°) para enriquecer assets do tipo property.
- **Telas:** `medicao` (WebView com protótipo HTML), `ar-medicao` (AR nativo/Viro).
- **Rotas:** `/medicao`, `/ar-medicao`.
- **Componentes principais:** `WebView` (`MEDICAO_HTML`, baseUrl https para localStorage+câmera), header com botão "◉ AR nativo".
- **Fluxos principais:** entra a partir de `assets/[id]/setup` ("medir o primeiro"); `/medicao` → `/ar-medicao`.
- **Dependências:** `react-native-webview`, ARKit/ARCore (produção), Viro (old arch, build nativo).
- **Observações:**
  - **Risco:** ambas as rotas são `exempt` no Gate → acessíveis **sem autenticação** (débito conhecido, superfície de risco em produção).
  - Bloqueio é ambiente/ARCore, não o código (ver memória do projeto). Manter como POC isolado.

## 12. Estados Globais

- **Objetivo:** loading, empty, erro, offline e conectividade — comportamento transversal a todas as telas.
- **Telas/Rotas:** nenhuma dedicada (transversal).
- **Componentes principais:** `Skeleton*`, `EmptyState`, `NotFoundView` (+404 em `+not-found.tsx`), `Button loading`, `ActivityIndicator`, `Alert.alert`, `UpdateBanner`, `SplashBrand`.
- **Fluxos principais:** primeiro load → skeleton/spinner; vazio → EmptyState; erro → `Alert` nativo.
- **Dependências:** React Query, `api/client.ts` (ApiError status 0 amigável).
- **Observações:**
  - **Crítico:** zero detecção de offline — NetInfo não é usado em código de app; sem banner "sem conexão", sem fila offline, sem revalidação ao reconectar. Grave num app de campo.
  - **Alto:** erros de query sem UI de retry (`PaginatedList` nem expõe `isError`); sem `Toast`/`Snackbar` compartilhado; sem `ErrorBoundary` global (só em `ar-medicao`). Erros de mutação viram `Alert.alert`.
  - **Médio:** skeleton e spinner coexistem sem regra clara.

## 13. Design System

- **Objetivo:** base de tokens + componentes compartilhados entre customer e provider.
- **Telas/Rotas:** `packages/shared/src/ui` + `packages/shared/src/theme`.
- **Componentes principais:** `Text`, `Button`, `Card`, `Badge`, `Chip`, `Field`, `Segment`, `Screen`, `Wiz`, `SlideToConfirm`, `BudgetMeter`, `PaginatedList`, `Skeleton*`, `EmptyState`, `AppDrawer`, `Stars`, `PaymentSelector`, `DynamicFields`, `QnaThread`, primitives (`Row`, `IconButton`, `AvatarGrad`, `BackBar`, `SectionLabel`, `Toggle`…), auth kit (`AuthField`, `OtpInput`, `GoogleButton`, `BrandMark`, `DividerOr`). Temas: `sunset`, `trust`, `night`.
- **Fluxos principais:** consumo via `useTheme()`; tokens de cor/radius/shadow/gradiente/fonte.
- **Dependências:** portado 1:1 do rebrand walvee → chamafacil (tokens idênticos).
- **Observações:**
  - **Crítico:** contraste WCAG AA reprovado sistemicamente — accent 2.85:1 (CTA primário), soft 2.54:1, ok 2.57:1, `ink3` 2.59:1 (usado como texto legível apesar do próprio comentário admitir a falha).
  - **Alto:** `<Sheet>`/`<BottomSheet>` ausente → **6+ reimplementações** idênticas de Modal+backdrop+handle (com divergências de padding e a11y). Sem escala de spacing (números mágicos 12/13/14/16…). Tipografia inline fora de `<Text variant>` (drift). Sem `isError`/Toast/ErrorBoundary.
  - **Médio:** `Toggle` é visual-only (sem `onValueChange`/role switch); 3× `SelectField` duplicado; focus ring só no web e incompleto; anel perpétuo no badge; realtime não reassina em troca de token; grabber sugere arrasto que não existe (affordance mentirosa).
