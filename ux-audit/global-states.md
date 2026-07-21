# Estados Globais — App Customer (Chama Fácil)

**Relatório final** · pt-BR · Data: 2026-07-20
**Tema:** loading / empty / error / offline tratados como **sistema** — não como detalhe de tela.
**Fontes:** `ux-audit/_notes/cluster-design-system-global.md`, `dynamic-walkthrough.md`, `audit/` (FUNC-01, DS-02).

---

## Veredito

Metade do sistema de estados existe e é boa (**empty** e **loading** têm componentes de primeira). A outra metade **não existe**: não há estado de **erro** renderizado, não há **offline** (nenhum NetInfo), não há `ErrorBoundary` global nem `Toast`. Como resultado, tudo que dá errado cai no `Alert.alert` nativo — bloqueante, off-brand no web e sem retry. Um app precisa de **quatro** estados como cidadãos de primeira classe; hoje tem dois.

**Score de estados globais: 45/100.**

---

## 1. O que EXISTE e está bom

- **`EmptyState`** (`EmptyState.tsx`): sólido — `tone` brand/muted, ícone com halo, CTA opcional, `fill`. Bem usado (`notifications.tsx:49`, `dashboard.tsx:139`). Ressalva: ícone muted usa `ink3` (contraste 2.59:1).
- **`Skeleton`** família (`Skeleton.tsx`): `SkeletonCard/List/Tiles/Screen`. Usado no 1º load do `PaginatedList` (`:103-104`). Ótima base.
- **`SuccessSplash`** existe no kit — mas **não é acionado** no envio do pedido nem no aceite (ver §5, momentos de sucesso faltando).
- **`NotFoundView`** para rotas inexistentes. OK.

## 2. O que FALTA

### 2.1 Estado de erro global — **Alto**
- `PaginatedList` não expõe `isError` na interface `InfiniteListQuery` (`PaginatedList.tsx:33-41`). Query falha → nada/vazio, sem retry (FUNC-01).
- **Sem `<ErrorState>`** (irmão do `EmptyState`) para queries falhas.
- **Sem `<Toast>`/`Snackbar`** compartilhado — busca por `Toast|Snackbar` acha só `ar-medicao.tsx`. Mutações erram via `Alert.alert` (DS-02).
- **Sem `ErrorBoundary` global** — busca por `ErrorBoundary` acha só `ar-medicao.tsx`. Um crash de render derruba a tela inteira sem tela de recuperação.

### 2.2 Estado offline — **Crítico**
- **Zero NetInfo** no código (§3 de `performance.md`). Sem banner offline, sem fila, sem revalidação ao reconectar. O "offline" do dashboard é status de trabalho do prestador, não rede.
- Grave num app de campo: cliente na estrada (persona "aflito na estrada") perde conexão e não recebe nem aviso nem retry.

### 2.3 Toast/feedback transitório — **Alto**
- Sucessos ("Salvo", "Enviado") e erros não destrutivos deveriam ser Toast não-bloqueante + live region (a11y). Hoje: `Alert.alert` bloqueante.

---

## 3. Tabela: Estado × Cobertura

| Estado | Componente existe? | Renderizado nas telas? | Acessível? | Lacuna |
|---|---|---|---|---|
| **Loading** | Sim (`Skeleton*`, `ActivityIndicator`) | Parcial (skeleton só em `PaginatedList`; spinner em `dashboard`) | Sem `accessibilityLiveRegion` de "carregando" | Regra skeleton vs spinner |
| **Empty** | Sim (`EmptyState`) | Sim, bem usado | Parcial (ícone ink3 baixo contraste) | Só o contraste do ícone |
| **Error** | **Não** (`<ErrorState>` inexiste) | **Não** — erro vira `Alert.alert` ou vazio | Não (Alert nativo rouba foco) | **Componente + `isError` na query + Toast + ErrorBoundary** |
| **Offline** | **Não** (sem NetInfo) | **Não** | **Não** | **`useConnectivity()` + `<OfflineBanner>` + fila** |
| **Success** | Sim (`SuccessSplash`) | **Não acionado** nos fluxos-chave (envio/aceite) | — | Ligar aos momentos Peak-End |

---

## 4. Mocks ASCII

### Banner offline (montado no `Screen`/root, acima do conteúdo)
```
┌──────────────────────────────────────────────┐
│  ⚠  Sem conexão — tentando reconectar…    ⟳  │  ← fundo warn suave, texto ink escuro (AA)
├──────────────────────────────────────────────┤
│                                                │
│   [ conteúdo da tela, ações enfileiradas ]     │
│                                                │
```
Ao reconectar, o banner troca por um estado transitório e some:
```
┌──────────────────────────────────────────────┐
│  ✓  Conectado — sincronizando 2 ações…        │  ← fundo ok suave; auto-dismiss 2s
└──────────────────────────────────────────────┘
```

### Toast de erro (não-bloqueante, canto inferior, acima da tab bar)
```
                                         (some em 4s ou ao tocar ✕)
        ┌────────────────────────────────────────┐
        │ ✕  Não foi possível enviar o pedido.    │
        │    Toque para tentar de novo.      [↻]  │  ← surface + borda danger; role="alert"
        └────────────────────────────────────────┘
```

---

## 5. Momentos Peak-End (sucesso ausente) — **Médio/Alto**

- **Sem sucesso ao enviar pedido** (`12→13`): cai direto no detalhe "Aberto". O pico de esforço (10 interações, 7 telas) não é recompensado. Acionar `SuccessSplash`.
- **Aceite de proposta sem confirmação** (`16→17`): compromisso financeiro (R$103,20) transiciona direto ao rastreio, sem "Contratar Provider 04 por R$103,20 — confirmar?" nem feedback. **Alto** — decisão financeira sem resumo.

---

## 6. Tabela de problemas por severidade

| Problema | Impacto | Solução | Justificativa | Esforço | Prioridade |
|---|---|---|---|---|---|
| Sem estado offline (NetInfo/banner/fila) | Usuário de campo sem aviso nem retry; ações perdidas | `useConnectivity()` + `<OfflineBanner>` global + fila idempotente | 0 cobertura; persona na estrada | G | **Crítica** |
| Sem `<ErrorState>` + `isError` na query | Query falha vira tela vazia/Alert; sem retry | Expor `isError/refetch`; `<ErrorState onRetry>` | FUNC-01 ainda válido | M | **Alta** |
| Sem `<Toast>` compartilhado | Feedback via Alert.alert bloqueante/off-brand | `<Toast>` + provider; role="alert" (live region) | DS-02 ainda válido | M | **Alta** |
| Sem `ErrorBoundary` global | Crash de render derruba a tela sem recuperação | `ErrorBoundary` no root layout de cada app | Só existe em ar-medicao | M | **Alta** |
| Momentos de sucesso ausentes | Pico de esforço sem recompensa; aceite sem confirmação | Acionar `SuccessSplash`; resumo de confirmação no aceite | Peak-End + risco financeiro | M | Média |
| Loading sem regra + sem live region | Percepção inconsistente; leitor não anuncia carregando | Padronizar skeleton/spinner; `accessibilityLiveRegion` | Coexistência real | P | Média |
| Ícone do `EmptyState` muted em ink3 | Baixo contraste (2.59:1) | Migrar para ink2 / cor decorativa AA | Reprova AA | P | Baixa |

---

## Score de estados globais

| Estado | Nota |
|---|---|
| Loading | 65 |
| Empty | 80 |
| Error | 20 |
| Offline | 10 |
| Success/Peak-End | 40 |
| **Total** | **45/100 — Metade do sistema existe; erro e offline são buracos** |
