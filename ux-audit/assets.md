# Assets (Patrimônio)

Módulo: subsistema de assets — `assets/index.tsx`, `assets/new.tsx`, `assets/[id]/index.tsx`, `assets/[id]/edit.tsx`, `assets/[id]/setup.tsx` + onboarding do zero (`HomeAssets.tsx`, `FirstAssetTutorial.tsx`) — App do Cliente (Chama Fácil).
Fontes: `ux-audit/_notes/cluster-home-create-assets.md` (§6, §7, §8) e `ux-audit/_notes/dynamic-walkthrough.md` (achados 4, 10, 22).
Data: 2026-07-20

---

## Visão geral (objetivo; personas)

**Objetivo do módulo.** O subsistema de assets guarda os "bens" do cliente (veículo, imóvel, pet) para pré-preencher pedidos e manter histórico. **Deveria ser um acelerador opcional** do funil; na prática virou **pedágio** — pré-requisito de fato do pedido (ver `service-requests.md`, "asset obrigatório") e da primeira experiência do app.

**Diagnóstico de uma frase.** O app foi desenhado como um *CRM de patrimônio pessoal* ("assets são o centro de gravidade" — comentário literal em `HomeAssets.tsx:31-35`), não como app de socorro sob demanda; toda a arquitetura assume que o pedido é sobre uma "coisa" cadastrada.

**Personas.**
- **Aflito na estrada** (âncora): carro quebrado, nunca cadastrou nada. Para ele, cadastrar patrimônio no meio do pedido é atrito puro no pior momento.
- **Planejador/mantenedor**: cuida do carro/casa ao longo do tempo; para ele, a ficha do bem, o histórico e o setup guiado fazem sentido. As telas de detalhe/edição/setup servem bem *esta* persona — o problema é impô-las à primeira.

---

## Fluxos (texto + fluxograma Mermaid válido)

- **Onboarding do zero:** primeira visita com `assets.length === 0` → `FirstAssetEmpty` (`HomeAssets.tsx:55`) abre automaticamente um **modal full-screen** `FirstAssetTutorial` (`HomeAssets.tsx:125-146`, `FirstAssetTutorial.tsx:52`). O CTA final (`start`, `FirstAssetTutorial.tsx:41-46`) faz `router.push('/assets/new?guided=1')` — empurra cadastro de patrimônio como primeira ação, antes de qualquer pedido.
- **Cadastro como pedágio do pedido:** na etapa 1 do wizard, categoria de veículo sem asset → `/assets/new?pick=1&type=vehicle` (`request/new.tsx:92`) → volta com asset auto-selecionado (`takeCreatedAsset`, `new.tsx:85-90`).
- **Gestão (para o mantenedor):** `index` (lista) → `[id]` (detalhe, abas identidade/histórico) → `edit` (formulário) e `setup` (cômodos guiados de imóvel).

```mermaid
flowchart TD
    ZERO[1ª visita · 0 assets] --> FT[Modal full-screen<br/>FirstAssetTutorial]
    FT -->|CTA 'começar'| ANEW[/assets/new?guided=1/]
    REQ[Etapa 1 do pedido · veículo sem asset] -->|Adicionar| APICK[/assets/new?pick=1&type=vehicle/]
    ANEW --> LIST[/assets index/]
    APICK -->|auto-seleciona| REQ
    LIST --> DET[/assets/[id] · identidade+histórico/]
    DET --> EDIT[/assets/[id]/edit/]
    DET --> SETUP[/assets/[id]/setup · cômodos/]

    style FT fill:#ff6b6b,color:#fff
    style APICK fill:#ffa94d,color:#000
```

---

## Problemas encontrados (por severidade; evidência)

### Crítico
- **Onboarding do zero prioriza cadastrar patrimônio, não pedir.** Para a persona da estrada é o pior cenário: instala o app com o carro quebrado, abre, e a primeira coisa é um carrossel de 3 telas sobre "cadastre sua casa/carro/pet, tire fotos, agende manutenção" (`firstAsset.steps.*`). A ação de *pedir socorro* não aparece nesse fluxo. É skipável (`FirstAssetTutorial.tsx:60-65`), mas o fardo cognitivo já foi imposto no pior momento. Evidência: `cluster-home-create-assets.md §7`; `HomeAssets.tsx:55`, `FirstAssetTutorial.tsx:41-46, :52`.
- **Cadastro de asset como pré-requisito do pedido.** Detalhado em `service-requests.md`; a origem estrutural está aqui: o pedido assume uma "coisa" cadastrada (`request/new.tsx:212`). Evidência: `cluster-home-create-assets.md §6.1, §4.4`.

### Alto
- **Sub-wizard de cadastro no pior momento pede dados cerimoniais.** Mesmo no modo picker (vindo do pedido), a etapa `details` exige nickname obrigatório (`assets/new.tsx:156-160`, `nickname.trim().length >= 2`) — o usuário é forçado a *batizar o carro* ("Meu Gol") para desbloquear um guincho — além de oferecer marca/modelo, km e notas privadas/pro (`assets/new.tsx:355-376`), tudo fora de lugar numa emergência. Evidência: `cluster-home-create-assets.md §6.3`.
- **Dados do asset não chegam ao prestador.** O prestador pergunta no QnA dados que o app já tem (marca/modelo do veículo estão no ativo "Test · AJP · PR3 125 Enduro"), evidenciando que os dados do asset não são repassados — anulando o próprio benefício de cadastrar. Evidência: `dynamic-walkthrough.md` achado 4; `15`, `16` .png.

### Médio
- **Provider/estado "0.0 · 0 serviços" com 5 estrelas vazias** aparece como nota zero (negativo) em superfícies alimentadas por dados de asset/serviço, quando deveria ser "Novo"/"Sem avaliações" (padrão de exibição a alinhar com o subsistema). Evidência: `dynamic-walkthrough.md` achado 10; `16`.
- **Investimento de UX na etapa de tipo do cadastro.** Cards de tipo animados com reveal de benefícios (`assets/new.tsx:194-258`) — bonito, mas é muito investimento numa etapa que, para a persona da estrada, é puro atrito (felizmente `pick=1&type=vehicle` já fixa o tipo e pula essa etapa).

### Baixo
- **`ICON` de tipo de asset duplicado.** Redefinido localmente em `assets/[id]/index.tsx:30` além de existir em `assetDisplay` — fonte de verdade divergente. Evidência: `cluster-home-create-assets.md §8.3`.

### Pontos positivos (manter)
- `assets/index.tsx`: `PaginatedList` com filtro por tipo em chips, empty state e footer "Adicionar" (`:34-56`) — sólido e consistente; reusa `assetCaption`/`ICON` de `assetDisplay`.
- `assets/[id]/index.tsx`: timeline unificada de 3 fontes (requests + readings + parts) num único `TimelineEvent` ordenado (`:36-89`), com honestidade de paginação (`:268-275`), skeleton dedicado (`:91`) e `NotFoundView` (`:93-104`) — arquitetura de dados exemplar.
- `assets/[id]/edit.tsx`: arquivar (soft-delete) em vez de excluir, com `Alert` destructive e hint textual (`:82-90, :171`) — boa prevenção de erro.
- `assets/[id]/setup.tsx`: honesto ("nada fabrica medição", `:18-20`), escopo correto (só primeiro imóvel `guided=1`), não impacta o funil de veículo.
- `assets/new.tsx` reusa o chrome `Wiz` do pedido (`:184`) — ótima consistência de DS; etapas adaptam a tipo e entry-point (`:79-82`).

---

## Melhorias

| Problema | Impacto | Solução | Justificativa | Esforço | Prioridade |
|---|---|---|---|---|---|
| Onboarding do zero empurra cadastro | 1ª experiência do usuário aflito é um tutorial de inventário | Inverter: ação primária = "Preciso de ajuda agora"; "cadastrar meu patrimônio" vira secundária/adiável; não abrir modal automático | Foco na tarefa real do primeiro uso | M | Crítico |
| Asset como pré-requisito do pedido | Bloqueia conversão do 1º pedido | Substituir "patrimônio obrigatório" por **veículo como contexto opcional**: dropdown se cadastrado, senão **placa inline** (1 campo); salvar como asset é oferta pós-envio | Carro é contexto, não pré-requisito; captura leve > cadastro cerimonial | M | Crítico |
| Nickname obrigatório no sub-wizard | Força "batizar o carro" numa emergência | Tornar nickname opcional (default = placa/modelo); no modo picker, pedir só o mínimo | Remove atrito cerimonial | P | Alto |
| Dados do asset não chegam ao prestador | Cliente reinforma o que o app já tem | Repassar marca/modelo do asset ao payload do pedido/QnA | Elimina retrabalho; justifica o cadastro | M | Alto |
| Cards de tipo animados no cadastro | Investimento em etapa de atrito | Simplificar quando `pick`/tipo fixo; reservar a animação para o fluxo de gestão | Adequação ao contexto | P | Médio |
| "0.0 · 0 serviços / 5 estrelas vazias" | Parece nota zero | Exibir "Novo"/"Sem avaliações" quando `count === 0` | Evita sinal negativo falso | P | Médio |
| `ICON` duplicado | Fonte de verdade divergente | Unificar em `assetDisplay` (`[id]/index.tsx:30`) | Higiene de DS | P | Baixo |

**Mock ASCII — veículo como contexto opcional (substitui o pré-cadastro de "patrimônio"):**

```
┌──────────────────────────────────────┐
│  Carro (opcional)                      │
│  ┌────────────────────────────────┐   │
│  │  [ Meu Gol ▾ ]  ← se já houver  │   │
│  └────────────────────────────────┘   │
│   ou digite a placa:                   │
│  ┌────────────────────────────────┐   │
│  │  ABC1D23                        │   │
│  └────────────────────────────────┘   │
│                                        │
│  ▸ pedido segue sem bloquear ▸         │
│                                        │
│  (após enviar)                         │
│  ☐ Salvar este carro para o próximo    │
│     pedido                             │
└──────────────────────────────────────┘
```

O cadastro completo (nickname, fotos, notas, histórico) deixa de ser pedágio e passa a ser um convite *pós-envio* — atendendo o mantenedor sem penalizar o aflito.

---

## UI
- Padrão visual sólido e coerente: chips de filtro, empty states, footer "Adicionar", timeline de detalhe densa mas justificada.
- Modal full-screen do tutorial e cards de tipo animados são bem executados — o problema é *quando* aparecem, não *como*.

## UX
- As telas de gestão (index/detalhe/edit/setup) são bem construídas para o mantenedor; a fricção nasce de forçá-las na primeira visita e no meio do pedido.
- Boa honestidade de escopo em `setup` e boa prevenção de erro em `edit` (soft-delete).

## Design System
- Reuso forte de `Wiz`, `PaginatedList`, `EmptyState`, `assetDisplay`.
- **Baixo:** `ICON` redefinido em `[id]/index.tsx:30` diverge de `assetDisplay`.
- Modal do tutorial reimplementa o padrão Modal/backdrop/inset (candidato ao `<BottomSheet>`/overlay compartilhado — ver `cluster-home-create-assets.md §8.1`).

## Performance
- Paginação honesta na timeline do detalhe (`[id]/index.tsx:268-275`), skeletons dedicados. Sem gargalos observados.

## Acessibilidade
- **Alto:** cards do `AssetSelector` (`AssetSelector.tsx:44`) sem `role`/`accessibilityState={{selected}}` — seleção só por cor de borda + check (`:57`); reflete direto no pedido.
- Verificar `Card onPress` da lista/detalhe quanto a label agregado (leitor lê fragmentos soltos).

## Quick Wins
1. Não abrir o `FirstAssetTutorial` automaticamente; oferecer "pedir ajuda" como CTA primária do onboarding (P/M, Crítico).
2. Tornar nickname opcional no sub-wizard picker (P, Alto).
3. Exibir "Novo"/"Sem avaliações" no lugar de "0.0 · 5 estrelas vazias" (P, Médio).
4. Unificar `ICON` de tipo de asset (P, Baixo).

## Score
- UX: 4/10
- UI: 8/10
- Performance: 8/10
- Acessibilidade: 5/10
- Consistência: 8/10

**Nota final: 6,0/10** — As telas de gestão de patrimônio são das mais bem-construídas do app (timeline unificada, soft-delete, setup honesto, forte reuso de DS); a nota é puxada para baixo não pela qualidade dessas telas, mas por posicionar o subsistema como pedágio obrigatório do onboarding e do pedido, quando deveria ser um acelerador opcional.
