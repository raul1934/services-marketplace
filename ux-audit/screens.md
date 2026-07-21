# Chama Fácil — App Customer · Inventário de Telas

Rotas file-based do Expo Router em `apps/customer/app/`. 33 arquivos (30 telas + 3 layouts/gate).
Coluna **Estado**: `mapeado` = analisado por leitura de código; `device` = também percorrido no aparelho (evidência em `ux-audit/screens/NN-*.png`).
Data: 2026-07-20 · pt-BR.

> Convenção de URL: grupos entre parênteses (`(auth)`, `(tabs)`) não aparecem na URL. `[id]` é parâmetro dinâmico.

---

## Módulo: Infra / Gating

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| — (root) | `_layout.tsx` | Gate: providers + redirect por auth + realtime/push/chime | mapeado | — | Redirect em `useEffect` (flash 1 frame); POC `medicao`/`ar-medicao` exemptas de auth |
| `/` | `index.tsx` | Redirect → `/(tabs)/home` | mapeado | — | Só um `<Redirect>` (nenhum) |
| `*` (404) | `+not-found.tsx` | Catch-all de rota inexistente | mapeado | — | Nenhum (usa `NotFoundView`, com voltar/home) |
| — (auth) | `(auth)/_layout.tsx` | Stack do grupo auth | mapeado | — | — |
| — (tabs) | `(tabs)/_layout.tsx` | Tab-bar 3 abas (Início/Chamados/Perfil) | device | 18, 22 | **Crítico:** sem ação "Pedir"/"+" persistente |

## Módulo: Autenticação

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/welcome` | `(auth)/welcome.tsx` | Onboarding 3 slides + entrada p/ cadastro/login | mapeado | — | EnvSwitch em produção (Crítico); "Pular"→register; `<Text>` vazio clicável; cenas não ocultas do leitor de tela |
| `/login` | `(auth)/login.tsx` | Login telefone(OTP)/e-mail-senha/Google | mapeado | — | Sem "esqueci a senha" (Crítico); vaza `API:host` no erro (Crítico); sem autofill; sem toggle de senha |
| `/register` | `(auth)/register.tsx` | Criar conta (nome/e-mail/tel/senha) ou Google | mapeado | — | Termos não clicáveis; sem verificação de e-mail; labels ocultos; senha mín. 6 fraca |
| `/verify` | `(auth)/verify.tsx` | OTP 6 dígitos, auto-submit, reenvio 24s | mapeado | — | Reenvio sem feedback; `OtpInput` sem `accessibilityLabel`; borda de erro ausente |

## Módulo: Home / Descoberta

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/home` | `(tabs)/home.tsx` | Hub de conversão + drawer overlay | device | 00b, 18, 19, 22 | **Alto:** hierarquia invertida (patrimônio no topo, CTA no fim); card "Precisa de ajuda agora?" leva a `/categories` (hop extra) |
| `/categories` | `categories.tsx` | Catálogo completo por tipo | mapeado | — | Sem busca/filtro; sem error state (tela em branco se query falha) |

## Módulo: Serviços / Pedidos

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/request/new` | `request/new.tsx` | Wizard de criação (7 etapas fixas) | device | 01–12 | **Crítico:** 7 etapas p/ urgência; asset obrigatório bloqueia (`:212`); teclado cobre descrição; endereço muda entre etapas; campo "ACESSO" fora de contexto |
| `/request/:id` | `request/[id]/index.tsx` | Tela-mãe: 3 abas (Acompanhamento/Solicitação/Histórico), todos os estados | device | 13, 14, 16, 17 | **Alto:** até ~13 blocos numa aba (872 linhas); moeda `R$ 103.2` quebrada; aceitar proposta sem confirmação/sucesso; 2 controles p/ aceitar |
| `/request/:id/proposals` | `request/[id]/proposals.tsx` | Redirect legado → `[id]` | mapeado | — | Monta 1 frame React só p/ redirecionar (Baixo) |
| `/request/:id/track` | `request/[id]/track.tsx` | Redirect legado → `[id]` | mapeado | — | idem acima |

## Módulo: Propostas & QnA (embutido em `/request/:id`)

| Superfície | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------------|---------|-----------|--------|-----------|----------------------|
| Lista de propostas | `src/components/ProposalsList.tsx` | Ordenar/aceitar/contrapropor | device | 16 | Slide vs botão na mesma tela; contraproposta 1 rodada; sort visível com 0 propostas |
| Thread QnA | `packages/shared/.../QnaThread.tsx` | Responder pergunta do prestador | device | 15, 16 | **Alto:** assimétrico (cliente não pergunta); perguntas em EN; só pós-proposta |

## Módulo: Exceções

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/request/:id/surcharge` | `request/[id]/surcharge.tsx` | Aprovar/recusar sobretaxa | mapeado | — | `router.back()` mudo; loop → requote quando `tier=requote` |
| `/request/:id/requote` | `request/[id]/requote.tsx` | Aceitar nova cotação ou reabrir | mapeado | — | Feedback inconsistente com surcharge; loop com surcharge |
| `/request/:id/reschedule` | `request/[id]/reschedule.tsx` | Propor/responder novo horário | mapeado | — | **Crítico:** data como texto ISO (sem calendário); CTA não-fixo |
| `/request/:id/no-show` | `request/[id]/no-show.tsx` | Esperar/reabrir/cancelar | mapeado | — | "Esperar" = `back()` sem feedback; emoji como ícone |
| `/request/:id/dispute` | `request/[id]/dispute.tsx` | Abrir disputa (foto+texto) | mapeado | — | Duplica warranty; **não** deixa remover foto |
| `/request/:id/warranty` | `request/[id]/warranty.tsx` | Abrir garantia (redo/refund) | mapeado | — | Duplica dispute (deveria ser `ClaimForm` único) |

## Módulo: Recibo & Avaliação

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/request/:id/receipt` | `request/[id]/receipt.tsx` | Recibo (alias de notificação) | mapeado | — | Duplica `ReceiptView` inline; manter só como destino de push |
| `/request/:id/rate` | `request/[id]/rate.tsx` | Avaliação standalone | mapeado | — | **3ª** superfície da mesma review; `Stars` sem role/valor (a11y) |

## Módulo: Assets

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/assets` | `assets/index.tsx` | Lista de patrimônio (filtro por tipo) | mapeado | — | Sólido; sem ressalva grave |
| `/assets/new` | `assets/new.tsx` | Cadastro (sub-wizard, reusa `Wiz`) | device | — | Nickname obrigatório mesmo no modo picker → pedágio do pedido |
| `/assets/:id` | `assets/[id]/index.tsx` | Detalhe (identidade/histórico) | mapeado | — | `ICON` redefinido localmente (`:30`); densidade alta justificada |
| `/assets/:id/edit` | `assets/[id]/edit.tsx` | Editar / arquivar (soft-delete) | mapeado | — | Bem construído (Alert destrutivo correto) |
| `/assets/:id/setup` | `assets/[id]/setup.tsx` | Setup guiado de cômodos + AR | mapeado | — | Escopo correto; honesto ("nada fabrica medição") |

## Módulo: Notificações

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/notifications` | `notifications.tsx` | Lista paginada de avisos + deep-link | device | 23 | i18n misturado EN/PT; sem agrupamento por pedido; ETA em 3 formatos; timestamp em `ink3` (contraste) |

## Módulo: Perfil / Config

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/profile` | `(tabs)/profile.tsx` | Identidade + tema/idioma + Sair | device | 21 | **Alto:** não edita nada; sem excluir conta (bloqueio de loja); logout sem confirmação; botões sm < 44dp |

## Módulo: Medição AR (POC)

| Rota | Arquivo | Propósito | Estado | Screenshot | Principais problemas |
|------|---------|-----------|--------|-----------|----------------------|
| `/medicao` | `medicao.tsx` | POC medição via WebView (HTML self-contained) | mapeado | — | Acessível sem auth; produção exigiria ARKit/ARCore nativo |
| `/ar-medicao` | `ar-medicao.tsx` | AR nativo (Viro) | mapeado | — | Acessível sem auth; bloqueio é ambiente/ARCore; único com `ErrorBoundary` |

---

## Notas de cobertura

- **Percorridas no device (walkthrough):** home, drawer, wizard de criação (7 etapas), envio, detalhe do pedido + 3 abas, propostas em realtime, aceite, rastreio, lista de chamados, perfil, notificações. Evidências `00`–`23`.
- **Só por leitura de código:** telas de exceção, receipt, rate, categories, assets (new/edit/setup), AR, welcome/login/register/verify (fluxo de auth não re-executado nesta sessão de device).
- **Screenshots-chave:** `02` ("Continuar" desabilitado silencioso), `06` vs `07` (copy do pino antes do mapa), `16` (moeda quebrada + 2 controles de aceite), `19` (drawer redundante), `23` (i18n misturado).
