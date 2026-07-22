# Quick Wins — App Customer (Chama Fácil)

**Critério:** alto impacto, baixo esforço (foco em correções **P**). Ordenado por relação impacto/esforço.
**Base:** walkthrough dinâmico + 4 clusters. Evidências em `ux-audit/screens/NN-*.png`.
**Data:** 2026-07-20 · Idioma: pt-BR
Esforço: **P** (pequeno, poucas linhas) · **M** (médio). Impacto: **Alto / Médio / Baixo**.

> **Status (2026-07-21): 20 dos 27 já entraram** (✔), 4 entraram em parte (◐) e **faltam 4**: #18 (labels i18n nos ícones), #21 (confirmação ao aceitar proposta), #24 (endereço de fonte única) e #27 (anel do sino). A coluna `Achado` liga cada item ao ID canônico em `findings.md` — antes as duas listas não se referenciavam e saíram de sincronia.

> Todos os itens abaixo são correções localizadas que não exigem redesenho. Os cinco primeiros custam poucas linhas e removem os problemas mais visíveis do caminho feliz e os dois Críticos de segurança.

---

| # | Quick Win | Problema que resolve | Esforço | Impacto | Como fazer (1 linha) | Achado | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Formatter único de moeda** (`formatBRL`) | "R$ 103.2 / R$ 115.2" nas propostas vs "R$ 120,00" correto (`16` vs `14`) | **P** | **Alto** | Criar `formatBRL(v)` pt-BR (2 casas, vírgula) e usar no card de proposta | CONS-01 | ✔ `c4a4a9c` |
| 2 | **Gate `__DEV__` no `EnvSwitch`** | Toggle DEV/PROD visível em produção (`welcome.tsx:159`; `login.tsx:54`) | **P** | **Alto** | `if (!__DEV__) return null;` no topo de `EnvSwitch.tsx` | AUTH-01 | ✔ `41ade70` |
| 3 | **Remover "API: host" do erro de login** | Vazamento de host do backend ao usuário (`login.tsx:82-83`) | **P** | **Alto** | Apagar a concatenação `API: currentHost()` da `formError` | AUTH-03 | ✔ `41ade70` |
| 4 | **ETA unificada** (`formatEta`) | "1h4" vs "64 min" vs "~16 min" em telas diferentes (`16`,`23`,`17`) | **P** | **Médio** | `formatEta(min)` → "~16 min" / "1 h 4 min"; usar em proposta/notif/rastreio | CONS-03 | ✔ `da0590a` |
| 5 | **Pluralização de verdade** | "1 proposta(s)", "0 foto(s)", "5 proposta(s)" literais (`20`,`12`) | **P** | **Médio** | Helper `plural(n, 'proposta', 'propostas')`; "nenhuma" para 0 | CONS-05 | ✔ `41ade70` |
| 6 | **i18n dos títulos de aviso** | "New question from a pro" em inglês nas notificações (`23`) | **P** | **Alto** | Trocar a string hardcoded pela chave i18n pt-BR | CONS-02 | ✔ `8a5aad2` |
| 7 | **"Novo" em vez de "0.0"** | Provider sem histórico aparece como nota zero (`16`) | **P** | **Médio** | Se `reviews===0`, renderizar "Novo · sem avaliações" e ocultar estrelas | PROP-06 | ✔ `41ade70` |
| 8 | **Esconder ordenação com 0 propostas** | Sort Preço/Tempo/Nota visível no estado vazio (`13`) | **P** | **Baixo** | Renderizar o sort só quando `proposals.length > 0` | PROP-07 | ✔ `41ade70` |
| 9 | **Confirmação no logout** | Sair destrói a sessão em 1 toque sem aviso (`profile.tsx:71`) | **P** | **Médio** | `Alert`/sheet "Sair da conta?" antes de `signOut()` | PROF-02 | ✔ `41ade70` |
| 10 | **Contraste de "Cancelar chamado"** | Link destrutivo é cinza de baixo contraste (`13`) | **P** | **Médio** | Usar cor `danger` legível + `accessibilityRole="button"` | REQ-20 | ✔ `41ade70` |
| 11 | **Esconder campo ACESSO p/ guincho** | "ACESSO: Adulto com chave" num guincho de estrada (`06`) | **P** | **Alto** | Condicionar o campo à categoria (só serviços domésticos) | REQ-07 | ✔ `41ade70` |
| 12 | **Keyboard-avoidance na descrição** | Teclado cobre o campo "O que aconteceu?" (`03`,`04`) | **P** | **Alto** | `KeyboardAvoidingView`/scroll na etapa 1 do wizard | AUTH-15 | ✔ `fd25133` |
| 13 | **Mensagem inline no "Continuar" desabilitado** | Botão cinza sem dizer o que falta (`02`; `new.tsx:211-217`) | **P** | **Alto** | Texto "Descreva o problema para continuar" sob o botão | REQ-05 | ✔ `41ade70` |
| 14 | **`SuccessSplash` no envio do pedido** | Sem celebração ao enviar; cai direto em "Aberto" (`12`→`13`) | **P** | **Alto** | Reusar `SuccessSplash` (já existe) "Pedido enviado! Procurando profissionais…" | REQ-14 | ✔ `41ade70` |
| 15 | **Unificar mecanismo de aceite** | Slide na 1ª proposta, botão nas demais (`16`) | **M** | **Alto** | Usar o mesmo controle de aceite em todas as propostas | PROP-03 | ✔ `41ade70` |
| 16 | **Rótulos de campo persistentes** | Placeholder-como-label some ao digitar (`AuthField.tsx:35`) | **M** | **Alto** | Label acima do input no `AuthField`/`Field` (conserta login+register) | AUTH-04 | ◐ `41ade70` |
| 17 | **Escurecer `accent` do CTA** | CTA primário com contraste 2.85:1 (`Button.tsx:43`) | **P** | **Alto** | Ajustar token `accent` (ex. `#d94a1f`) ou usar `ink` no texto | DS-01 | ◐ `c4a4a9c`, `2d771d0` |
| 18 | **`accessibilityLabel` i18n em ícones** | TalkBack lê "bell"/"menu" em inglês (`primitives.tsx:32`) | **P** | **Médio** | Passar label i18n em `IconButton` de sino/menu/voltar | A11Y-09 | ✔ `36b817e` |
| 19 | **Rotular `Stars`** | TalkBack lê só "★", sem "3 de 5" (`Stars.tsx:24-27`) | **P** | **Médio** | `accessibilityRole="adjustable"` + `accessibilityValue={{now,min:1,max:5}}` | A11Y-03 | ✔ `c4a4a9c` |
| 20 | **Botões de tema/idioma ≥44dp + `selected`** | Alvos de 38dp sem estado selecionado (`profile.tsx:44-67`) | **P** | **Médio** | `size` maior + `accessibilityState={{selected}}` | PROF-03 | ✔ `c4a4a9c` |
| 21 | **Confirmação/feedback ao aceitar proposta** | Compromisso financeiro sem resumo nem sucesso (`16`→`17`) | **M** | **Alto** | Sheet "Contratar X por R$Y?" + `SuccessSplash` após aceitar | PROP-01 | aberto |
| 22 | **Feedback uniforme nas exceções** | surcharge/no-show dão `back()` mudo; requote/dispute dão Alert | **P** | **Médio** | Trocar `router.back()` silencioso por `SuccessSplash`/toast | EXC-04 | ✔ `41ade70` |
| 23 | **`accessibilityRole="button"` nos textos-como-botão** | "Aprovar"/"Recusar"/"Cancelar" sem role/target (`ProposalsList.tsx:387`) | **P** | **Médio** | Trocar `<Text onPress>` por `Pressable role=button` + `hitSlop` | A11Y-04 | ✔ `248bd30` |
| 24 | **Endereço de fonte única** | Endereço muda entre etapa 2 e revisão/detalhe (`07` vs `12`) | **M** | **Médio** | Reusar o mesmo reverse-geocode/valor em todas as telas | REQ-13 | aberto |
| 25 | **Cores distintas por status na lista** | Aceito/Em atendimento/Concluído todos verdes (`20`) | **P** | **Médio** | Mapear cada status a uma cor/badge distinta | CONS-04 | ✔ `c4a4a9c` |
| 26 | **Toast ao reenviar OTP** | Reenvio sem feedback; usuário não sabe se funcionou (`verify.tsx:45`) | **P** | **Médio** | Toast "Código reenviado" após `resend()` | AUTH-13 | ✔ `41ade70` |
| 27 | **Anel do sino pulsa só na chegada** | Loop infinito = ruído + bateria (`primitives.tsx:51-59`) | **P** | **Baixo** | Pulsar 1× ao chegar não-lida e parar, em vez de `Animated.loop` | NOTIF-01 | ✔ `36f07d2` |

---

## Sequência recomendada (sprint de quick wins)

**Lote 1 — 1 dia, poucas linhas, maior visibilidade (itens 1–8, 17):**
formatters de moeda/ETA, gate do EnvSwitch, remover host do erro, pluralização, i18n do aviso, "Novo", esconder sort, escurecer accent. Remove os dois Críticos de segurança e o bug de moeda mais visível.

**Lote 2 — funil e emergência (itens 11–14):**
esconder ACESSO, keyboard-avoidance, mensagem no Continuar, SuccessSplash no envio. Ataca diretamente a jornada da persona "Aflito na estrada".

**Lote 3 — a11y e consistência de interação (itens 9,10,15,16,18–23,25,26):**
confirmação de logout, contraste de Cancelar, mecanismo único de aceite, rótulos persistentes, labels de ícone, Stars, botões de tema, confirmação de aceite, feedback uniforme, roles nos textos-botão.

Total: **27 quick wins**, dos quais **21 são esforço P**. O Lote 1 sozinho (9 itens P) resolve os problemas mais gritantes do caminho feliz e os dois Críticos de produção.
