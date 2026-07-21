# Auditoria de UX/UI — Chama Fácil (App do Cliente)

> Auditoria completa, crítica e orientada a escala ("preparar o produto para milhares de usuários") do **app do cliente** do Chama Fácil — marketplace de serviços sob demanda (guincho, bateria, encanador, limpeza/diarista).
> Conduzida como um time multidisciplinar: Principal Product Designer, Staff UX, UX Researcher, UI, Mobile UX (iOS/Android), Design System Architect, Front-end Architect, QA, PM, CRO, Acessibilidade (WCAG 2.2) e HCI.

**Data:** 2026-07-20 · **Escopo:** app `customer` + design system compartilhado (`packages/shared`). Provider e admin Filament ficam para a 2ª rodada. · **Idioma:** pt-BR.

---

## Como esta auditoria foi feita (não é só leitura de código)

1. **Ambiente real**: backend Laravel em Docker local com dados de seed; app instalado num **device Android físico** (via USB/adb).
2. **Walkthrough dinâmico**: percorri os fluxos de verdade dirigindo o aparelho por adb (screencap + toques), como a persona **"aflito na estrada"**, capturando **23 screenshots de evidência** em [`screens/`](screens/). Cobri o caminho feliz ponta a ponta: Home → criação (wizard de 7 etapas) → envio → propostas em tempo real → aceite → rastreio ao vivo; além de drawer, lista, perfil e notificações.
3. **Leitura estática 100%**: as ~33 telas do app + o `packages/shared` foram lidos linha a linha, reconciliando com a pasta `audit/` pré-existente.
4. **Duas lentes extras** pedidas: *ser o usuário* (jornadas por persona, cronometradas, com jornada emocional) e *questionar o desenho* (arquitetura de informação, disposição de tela e fluxo — veredito manter/ajustar/redesenhar).

Heurísticas aplicadas: Nielsen; leis de Jakob, Fitts, Hick, Miller, Tesler, Doherty; Peak-End; Pareto; Gestalt. Acessibilidade: WCAG 2.2.

---

## Por onde começar

| Se você é… | Leia primeiro |
|---|---|
| Executivo / PM | [`summary.md`](summary.md) → [`roadmap.md`](roadmap.md) |
| Designer / DS | [`design-system.md`](design-system.md) · [`consistency.md`](consistency.md) · [`accessibility.md`](accessibility.md) |
| Engenharia | [`findings.md`](findings.md) · [`technical-debt.md`](technical-debt.md) |
| Quer o retorno rápido | [`quick-wins.md`](quick-wins.md) |
| Quer entender os fluxos | [`user-journey.md`](user-journey.md) · [`navigation-map.md`](navigation-map.md) |

---

## Estrutura da pasta

**Visão geral & executivo**
- [`summary.md`](summary.md) — relatório executivo: resumo, principais problemas, Top 100 melhorias, Top 20 quick wins, telas a redesenhar, matriz Impacto×Esforço, scores.
- [`findings.md`](findings.md) — tabela canônica de todos os achados (com IDs, severidade, evidência, solução, esforço).
- [`roadmap.md`](roadmap.md) — roadmap de 6 meses / Sprints, priorizando maior impacto primeiro.

**Transversais**
- [`modules.md`](modules.md) · [`screens.md`](screens.md) · [`navigation-map.md`](navigation-map.md) · [`user-journey.md`](user-journey.md)
- [`design-system.md`](design-system.md) · [`accessibility.md`](accessibility.md) · [`performance.md`](performance.md) · [`consistency.md`](consistency.md)
- [`quick-wins.md`](quick-wins.md) · [`technical-debt.md`](technical-debt.md)

**Por módulo** (cada um com Visão geral, Fluxos+Mermaid, Problemas por severidade, Melhorias, UI/UX/DS/Perf/A11y, Quick Wins, Score)
- [`authentication.md`](authentication.md) · [`onboarding.md`](onboarding.md) · [`home-discovery.md`](home-discovery.md)
- [`service-requests.md`](service-requests.md) · [`proposals-qna.md`](proposals-qna.md) · [`assets.md`](assets.md)
- [`exceptions.md`](exceptions.md) · [`notifications-realtime.md`](notifications-realtime.md) · [`profile-settings.md`](profile-settings.md)
- [`ar-measurement.md`](ar-measurement.md) · [`global-states.md`](global-states.md)

**Evidências**
- [`screens/`](screens/) — 23 screenshots numerados do walkthrough no device (`00-launch` … `23-notifications`).
- `_notes/` — notas brutas de campo (5 clusters) que embasaram os relatórios acima.

---

## TL;DR (veja o detalhe em `summary.md`)

O app tem **fundações fortes** — design system centralizado e tematizado, realtime funcionando, rastreio ao vivo com código de início, transparência de preço no orçamento. Mas, para escalar, três frentes doem:

1. **O funil de criação é longo demais** (wizard fixo de 7 etapas + ativo obrigatório) para um produto cujo caso de uso nº1 é emergência — o maior risco de conversão.
2. **Acessibilidade reprova sistemicamente** — contraste abaixo de AA em componentes-core (CTA 2.85:1) e ações-chave só por gesto (SlideToConfirm/medidor de orçamento), o que trava usuários de TalkBack/teclado.
3. **Consistência e navegação** — múltiplas superfícies redundantes, dois jeitos de aceitar proposta, moeda/tempo/idioma formatados de formas diferentes, e um EnvSwitch DEV/PROD exposto em produção.

Nenhum desses exige reescrita: são redesenhos focados de fluxo + tokens/componentes do próprio DS.
