# Performance Percebida — App Customer (Chama Fácil)

**Relatório final** · pt-BR · Data: 2026-07-20
**Foco:** performance **percebida** (feedback, latência sentida, jank), não profiling de CPU/RAM.
**Fontes:** `ux-audit/_notes/cluster-design-system-global.md`, `dynamic-walkthrough.md`, `audit/` (FUNC-01, DS-02, VIS-01).

---

## Veredito

A base de skeletons é boa, mas a percepção de performance é **inconsistente e frágil na adversidade**. Convivem skeleton e spinner sem regra; **não há estado de erro renderizado** (erros caem em `Alert.alert` nativo, bloqueante e off-brand no web); **não há detecção de rede** (sem NetInfo/offline/fila/revalidação) — grave para um app de campo (cliente na estrada, prestador em deslocamento). O mapa Leaflet em WebView adiciona custo perceptível no fluxo mais crítico.

**Score de performance percebida: 55/100.**

---

## 1. Loading: skeleton vs spinner coexistem sem regra — **Médio**

- **Bom:** `Skeleton`/`SkeletonCard/List/Tiles/Screen` (`Skeleton.tsx`) existem e são usados no 1º carregamento do `PaginatedList` (`PaginatedList.tsx:103-104`).
- **Mas** telas compostas ainda usam `ActivityIndicator`: provider `dashboard.tsx:141` (`isLoading ? <ActivityIndicator>`). Não há regra: algumas listas mostram skeleton, outras spinner → percepção inconsistente.
- **Recomendação:** padronizar — **skeleton** para 1º carregamento de conteúdo estruturado (dá forma antecipada, reduz ansiedade); **spinner** só para ações pontuais (footer de paginação `:131-132`, botão `loading`). Documentar no DS.

## 2. Ausência de estados de erro renderizados — **Alto**

- `PaginatedList` **não trata `isError`** — a interface `InfiniteListQuery` (`PaginatedList.tsx:33-41`) nem expõe `isError`. Query falha → lista vazia/nada, sem card de erro nem "tentar de novo" (FUNC-01).
- Erros de mutação surgem via `Alert.alert` (DS-02): no web vira `window.alert` **bloqueante e sem estilo**. Bloquear a thread de UI com diálogo nativo mata a fluidez percebida.
- `api/client.ts:152-156,180-185` já transforma "servidor inalcançável" em `ApiError(0, mensagem amigável)` — bom, mas **ninguém consome o status 0** para um estado dedicado; vira só mais um alert.
- **Recomendação:** `<ErrorState onRetry>` (irmão de `EmptyState`) para queries; `<Toast>` para mutações; parar de usar `Alert.alert` para feedback não destrutivo. Ver `global-states.md`.

## 3. Sem offline / NetInfo / fila / revalidação — **Crítico**

- **Zero uso de NetInfo** no código de app. A dep `@react-native-community/netinfo` existe (transitiva do pusher-js) mas **nenhum componente a usa** (`echo.ts:37-38`). Busca por `NetInfo|isConnected|useNetInfo`: só comentários.
- O "offline" de `dashboard.tsx:99,138` é o **toggle de disponibilidade do prestador**, não conectividade de rede. Falso positivo.
- Consequências para performance percebida: **sem revalidação ao reconectar** (dados velhos parados), **sem pausar/retomar queries** (React Query dispara requests no vácuo, cada uma esperando o timeout → percepção de "travado"), **sem fila offline** (record km, bid falham com alert em vez de enfileirar). Num app de campo isso é o pior cenário.
- **Recomendação:** `useConnectivity()` (NetInfo) + integração com `onlineManager` do React Query (pausa/retoma automática) + `<OfflineBanner>` global. Isso sozinho elimina os timeouts longos percebidos como travamento.

## 4. Doherty Threshold (feedback < 400ms) nos fluxos — **Médio/Alto**

O princípio de Doherty: interação com resposta < 400ms mantém o usuário engajado; acima disso, a atenção se dispersa. Pontos que violam:
- **"Continuar" desabilitado silenciosamente** (wizard step1, `02-step1-continue-empty.png`): 0 feedback ao toque → o usuário aflito toca e "não acontece nada". Viola a expectativa de resposta imediata.
- **Envio de pedido → detalhe "Aberto" sem transição/sucesso** (`12→13`): pico de esforço sem recompensa nem confirmação instantânea.
- **Aceitar proposta → rastreio direto** (`16→17`): compromisso financeiro sem feedback de confirmação; a transição some.
- **Mutações via `Alert.alert`**: o retorno da ação depende do round-trip do servidor sem feedback otimista → percepção de lentidão.
- **Recomendação:** feedback imediato em todo toque (estado pressed já existe, mas ações desabilitadas precisam sinalizar o porquê); **updates otimistas** para aceitar/enviar; micro-transição de sucesso (ver Peak-End em `global-states.md`).

## 5. Mapa Leaflet em WebView — custo no fluxo crítico — **Médio**

- `react-native-maps` não tem web; renderiza stub (VIS-01). No device, o rastreio usa mapa **Leaflet em WebView** que só carrega **após** tocar "Usar minha localização" (`06→07`) — a copy "Ajuste o pino" aparece antes do mapa existir (affordance mentirosa). WebView tem custo de inicialização (bridge + render engine) sentido no momento de maior ansiedade (rastreio ao vivo).
- **Recomendação:** pré-aquecer/lazy-mount a WebView do mapa antes da tela de rastreio; placeholder skeleton do mapa enquanto carrega; considerar tiles em cache. Evitar prometer UI (pino) antes de montar o mapa.

## 6. Imagens — **Baixo/Médio**

- Etapa 5 é uma tela inteira só para "Adicionar foto" opcional (`10-step5.png`) — não há custo de upload no caminho feliz porque é pulável, mas quando usada não há evidência de compressão/resize client-side nem placeholder progressivo. Avatares de provider usam `AvInit`/`AvatarGrad` (iniciais) como fallback — bom, evita layout shift.
- **Recomendação:** comprimir/resize antes do upload; `contentFit`/placeholder para imagens remotas; dimensões fixas para evitar reflow.

---

## Tabela de problemas por severidade

| Problema | Impacto | Solução | Justificativa | Esforço | Prioridade |
|---|---|---|---|---|---|
| Sem offline/NetInfo/fila/revalidação | Timeouts longos percebidos como travamento; dados velhos; ações perdidas | `useConnectivity()` + `onlineManager` + `<OfflineBanner>` + fila | App de campo; 0 cobertura hoje | G | **Crítica** |
| Erro de query não renderizado (só Alert.alert) | Diálogo nativo bloqueante; sem retry; fluxo quebra | `<ErrorState onRetry>` + `<Toast>`; parar Alert p/ feedback | FUNC-01/DS-02 ainda válidos | M | **Alta** |
| Doherty: ações sem feedback <400ms | Percepção de lentidão; usuário aflito desiste | Updates otimistas; sinalizar botão desabilitado; micro-sucesso | Fluxo de emergência | M | **Alta** |
| Skeleton vs spinner sem regra | Percepção inconsistente de velocidade | Padronizar skeleton(1º load)/spinner(ação) | Coexistência real | P | Média |
| Mapa Leaflet WebView caro no rastreio | Lentidão no momento de maior ansiedade | Pré-aquecer WebView; skeleton do mapa | Fluxo crítico | M | Média |
| Imagens sem compressão/placeholder | Upload lento; layout shift | Resize client-side; placeholder progressivo | Etapa foto | M | Baixa |
| Estilos inline recriados por render | Jank em listas grandes | `StyleSheet.create` p/ partes estáticas | ~23 comps | M | Baixa |

---

## Score de performance percebida

| Eixo | Nota |
|---|---|
| Loading states (skeleton) | 65 |
| Tratamento de erro/latência | 40 |
| Resiliência offline | 20 |
| Feedback imediato (Doherty) | 55 |
| Custo de mapa/imagens | 60 |
| **Total** | **55/100 — Aceitável no caminho feliz, frágil na adversidade** |
