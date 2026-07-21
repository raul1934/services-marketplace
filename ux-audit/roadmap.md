# Roadmap de Evolução — App do Cliente (Chama Fácil)

Horizonte de 6 meses, priorizando **maior impacto na experiência primeiro**. Sprints de 2 semanas. Itens marcados **[Direção]** refletem decisões de produto já tomadas pelo cliente (confirmações/carregamentos; etapas de criação por tipo de chamado; aceite via tela de detalhe da oferta).

Legenda de esforço: **P** (≤2 dias), **M** (≤1 sprint), **G** (multi-sprint). Referências: [`findings.md`](findings.md), [`summary.md`](summary.md), relatórios por módulo.

---

## Princípios de priorização
1. **Desbloquear escala primeiro:** acessibilidade e segurança que hoje excluem usuários ou vazam ambiente.
2. **Proteger a conversão:** o funil de criação e o aceite de oferta são o coração do negócio.
3. **Quick wins em paralelo:** correções P de alto impacto entram já, sem esperar os épicos.
4. **Medir para iterar:** instrumentar o funil cedo para guiar o CRO dos meses seguintes.

---

## Sprint 1 (semanas 1–2) — "Higiene crítica + quick wins"
**Meta:** eliminar bloqueios de escala baratos e as inconsistências mais visíveis.
- [P] Formatter de moeda pt-BR único (corrige `R$ 103.2`) e utilitário de ETA único (`1h4`→consistente). `<Price>` no DS.
- [P] Gate `__DEV__` / remover **EnvSwitch** da UI de produção.
- [P] Parar de vazar host do backend em erros de login.
- [P] `<StatusPill>` com cores por estado (fim do "tudo verde").
- [P] i18n: traduzir títulos de aviso ("New question from a pro") e strings hardcoded; pluralização ("(s)").
- [P] "Esqueci a senha" (link + fluxo via OTP existente).
- [P] Rótulos persistentes + `autoComplete`/`textContentType` nos formulários de auth.
- [P] Confirmação no logout; contraste do link "Cancelar chamado"; "Novo" em vez de "0.0".
- [P] Esconder ordenação Preço/Tempo/Nota com 0 propostas; esconder campo "ACESSO" fora de contexto.

## Sprint 2 (semanas 3–4) — "Acessibilidade AA + padrão de feedback [Direção]"
**Meta:** passar o essencial em WCAG AA e criar o padrão de confirmação/carregamento.
- [P/M] **Corrigir a paleta para WCAG AA** (accent/on-accent, soft, ok, ink3) — decisão de token que propaga.
- [M] **[Direção] Padrão de confirmação + carregamento + sucesso** no DS (diálogo p/ ações irreversíveis/financeiras; botão `loading`; toast). Aplicar em aceitar/cancelar/disputar/enviar.
- [M] Acessibilizar `SlideToConfirm` e `BudgetMeter` (alternativa por toque/teclado, role adjustable, `accessibilityValue`).
- [M] `accessibilityLabel`/`Role` nos Pressables custom principais; `Stars` com valor; `IconButton` sem nome de ícone em inglês.
- [P] Keyboard-avoidance no campo de descrição; explicar por que "Continuar" está desabilitado.

## Sprint 3–4 (semanas 5–8) — "Redesenho do funil de criação [Direção]"
**Meta:** o maior ganho de conversão. Épico central.
- [G] **[Direção] Criação adaptativa por tipo de chamado:** motor de etapas dirigido pela categoria; essencial (o que + onde) primeiro; **modo expresso** para urgência (guincho/bateria).
- [M] Veículo/ativo **opcional** (placa inline) — remover o pedágio de "patrimônio" antes de pedir.
- [M] Absorver foto/perguntas/agendamento como enriquecimento pós-envio quando não essenciais.
- [P] Momento de **sucesso ao enviar** (Peak-End); endereço estável entre etapas.
- [M] Instrumentar **telemetria de funil** (abandono por etapa) para orientar o CRO.
- **KPI:** toques até enviar (meta ≤4 no expresso), taxa de conclusão do funil, tempo até 1ª proposta.

## Sprint 5–6 (semanas 9–12) — "Navegação + aceite de oferta [Direção] + onboarding"
**Meta:** simplificar a IA e o momento de decisão da oferta.
- [M] **Ação "Pedir" persistente** (FAB/aba); aposentar/reduzir o **drawer** redundante.
- [M] **[Direção] Seleção de oferta por tela de detalhe:** lista → toque → **detalhe da oferta** com resumo do compromisso; **slide para aceitar dentro do detalhe** + confirmação/carregamento/sucesso.
- [M] **Onboarding valor-primeiro** (splash → pedir; cadastro só quando necessário).
- [P] Corrigir hierarquia da Home (pedir ajuda como nº1).
- **KPI:** taxa de aceite de proposta, tempo de decisão, retorno à home.

---

## Mês 4 — "Conta, mensagens e robustez"
- [G] **Perfil/Conta completo:** editar dados, formas de pagamento, endereços salvos, preferências de notificação e **exclusão de conta** (LGPD/lojas).
- [G] **Central de mensagens:** QnA simétrico (cliente também pergunta) + **notificações agrupadas por pedido** (fim do "99+").
- [M] **Estado offline** (NetInfo + banner + fila + revalidação ao reconectar); ErrorBoundary global + toast (aposentar `Alert.alert`).
- [M] Refresh token (evitar logout global em 401).

## Mês 5 — "Consolidar exceções e pós-atendimento"
- [G] Consolidar exceções: grupo A (sobretaxa/requote/reagendar) em **sheets inline** no acompanhamento; grupo B (disputa/garantia) em **formulário único** parametrizado; resolver loop sobretaxa↔requote; date picker no reagendamento.
- [M] **Confirmação de conclusão pelo cliente** (liberar pagamento) — fechar o gap do ciclo.
- [M] Recibo unificado + exportável; unificar superfícies de avaliação; reduzir densidade da aba Acompanhamento (progressive disclosure).

## Mês 6 — "Design System, retenção e prevenção de regressão"
- [M] Evolução do DS: extrair `<Sheet>`, escala de spacing tokenizada, `<GradientCTACard>`, primitives via variantes de `<Text>`, guia de contribuição.
- [M] Retenção: repetir último pedido, favoritar prestador, prova social/estimativas na criação.
- [M] **Testes de acessibilidade automatizados no CI** (não regredir contraste/labels); expandir suíte e2e para os fluxos redesenhados.
- **Fechamento:** repetir esta auditoria no app **Provider** e no admin **Filament** (2ª rodada).

---

## Visão em uma tela

| Período | Tema | Resultado esperado |
|---|---|---|
| S1 | Higiene crítica + quick wins | Menos bugs visíveis; ambiente seguro; base consistente |
| S2 | Acessibilidade AA + padrão de feedback **[Direção]** | Passa AA no core; confirmações/carregamentos padronizados |
| S3–4 | **Funil adaptativo por tipo [Direção]** | Salto de conversão; telemetria ligada |
| S5–6 | Navegação + **aceite por detalhe [Direção]** + onboarding | IA simples; decisão de oferta clara; ativação melhor |
| Mês 4 | Conta + mensagens + offline | Retenção e robustez; conformidade de loja |
| Mês 5 | Exceções + pós-atendimento | Ciclo completo e enxuto |
| Mês 6 | DS + retenção + CI de a11y | Escalável e sem regressão; pronto p/ 2ª rodada (Provider/Admin) |

> Sequência pensada para **impacto na experiência primeiro**: desbloqueia quem hoje é excluído (S1–S2), depois destrava a conversão (S3–S6), depois aprofunda retenção e robustez (meses 4–6).
