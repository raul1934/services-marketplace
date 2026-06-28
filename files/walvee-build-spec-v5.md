# walvee — Especificação de Build (V5 → App Final)

> **Objetivo.** Documento único para gerar a versão final dos apps de **Cliente** e **Prestador**. Toma a spec **V5** como fonte da verdade do *comportamento* e os protótipos enviados como fonte da verdade da *UI*, amarrando cada tela ao **componente real** já existente. As divergências entre V5, protótipo, site e jurídico foram **resolvidas** e estão registradas na seção 4 — nada aqui depende de decisão pendente.

> **Status por tela:** ✅ pronta (existe no protótipo e já reconciliada com a V5) · 🆕 nova (V5 exige, a construir). _Todas as reconciliações foram aplicadas — não há mais telas pendentes de ajuste._

---

## 0 · Como usar este documento

- Cada tela tem: **Componente** (nome real no protótipo), **Origem** (arquivo), **Propósito**, **Elementos**, **Estados/variações**, **Regras V5**, **Dados**, **Navega para**.
- As **Regras transversais** (seção 3) valem para todas as telas e não se repetem em cada uma — as telas só apontam quais se aplicam.
- A seção 4 registra as **decisões já tomadas** (todas resolvidas) — não há item bloqueando o build.
- A seção 9 é o **inventário-mestre** (checklist plano de tudo que precisa existir).

---

## 1 · Arquitetura de telas & navegação

- **Shell:** componente `Phone` (390×844 base, altura variável por tela), temas via classe `t-sunset` / `t-night` (`walvee-ui.css`). Região de scroll interna `.scroll`.
- **Plataforma:** React 18 + Babel standalone + Lucide. Kit compartilhado em `walvee-kit.jsx`; auth em `walvee-auth.jsx`; telas em `walvee-screens-customer.jsx`, `walvee-screens-provider.jsx`, `walvee-v3-customer.jsx`; fluxos em `walvee-create-flows.jsx`, `walvee-provider-bid-flows.jsx`, `walvee-job-flow.jsx`; Rotas em `walvee-v2-*.jsx`.
  > `design-canvas.jsx` (DesignCanvas/DCSection/DCArtboard) é **galeria de protótipo**, não faz parte do app final — não gerar.
- **Navegação Cliente (bottom nav):** Início · Pedidos · Ativos · Conta.
- **Navegação Prestador (bottom nav):** Painel · Solicitações · Agenda · Conta.
- **Drawer compartilhado (hambúrguer)** `AppDrawer` 🆕 — extrair o padrão de `walvee Prototipo.html` e promover a componente de runtime. Cabeçalho com avatar/nome/nota; itens agrupados (Conta · Atividade · Mais); badges de notificação; "Sair". Conjuntos de itens distintos por papel: **Cliente** (Meu perfil, Meus pedidos, Endereços, Pagamentos, Meus ativos, Notificações, Quero ser prestador, Ajuda & garantia, Configurações) e **Prestador** (Perfil profissional, Meus serviços, Ganhos & saques, Agenda, Avaliações, Notificações, Ajuda & garantia, Configurações).
- **Tema (setting de runtime)** — alternância light/dark (`sunset`/`night`) em Configurações, aplicada a todas as telas (hoje é prop de galeria; vira preferência persistida do usuário).

---

## 2 · Fundações & componentes compartilhados

Componente `Foundations` documenta o sistema "sunset" (light + dark): cor, tipografia (Manrope/Sora/mono), e os componentes base. Componentes-chave que o build deve tratar como reutilizáveis (vários aparecem repetidos nas telas):

| Componente UI | Uso | Telas que dependem |
|---|---|---|
| **Slide-to-confirm** | confirmar match, aprovar acréscimo/peça, iniciar/concluir | confirma profissional, acréscimo, aprovar peça, job start/end |
| **Faixa de referência (medidor)** | mostra média/faixa da região (e da peça) | criar pedido, pedido publicado, propostas, aprovar peça |
| **Delta vs. orçamento** 🆕 | "R$ X acima/abaixo do seu orçamento" por proposta | recebe propostas, detalhe da proposta |
| **Breakdown** | serviço + peças + taxa = total; peça e mão de obra **sempre separadas** | em serviço, aprovar peça, pagamento, detalhe do serviço |
| **Card de proposta** | nota + distância/ETA + valor + delta + "porquê do match" | recebe propostas |
| **Stepper de status** | Aceito › A caminho › Em serviço › Concluído | tracking, em serviço |
| **Linha de peça** | status por linha (aprovada / aguardando + botão) | em serviço, aprovar peça, trabalho ativo (pro) |
| **Banco de perguntas** 🆕 | bidirecional: fixas (tipo de ativo + categoria) + customizadas (cliente/pro) + flag de imagem por pergunta; cliente→pro pode gatear o lance | perguntar (pro), responder (cliente), criar pedido, enviar proposta |
| **Seletor de ativo** 🆕 | escolher ativo existente (filtrado por tipo) ou adicionar novo | criar pedido (P1, veicular/casa) |
| **Selo "com seguro"** 🆕 | sinaliza cobertura ativa do pro (opt-in) | recebe propostas, detalhe da proposta, perfil do pro |

---

## 3 · Regras transversais V5 (toda tela honra)

- **R-PREÇO.** O valor do cliente é **orçamento de referência não-vinculante**. Não filtra, não vira teto, não fecha sozinho. Alimenta o cálculo regional. Copy nunca diz "nomeie/defina o preço final" — diz "seu orçamento / referência".
- **R-CÁLCULO (faixa/média regional).** Motor do preço (faixa que o cliente vê + mediana que o pro vê). **Fonte:** transações que **fecharam e foram bem avaliadas** — não orçamentos nomeados nem lances perdidos; peso maior pro recente. **Granularidade adaptativa:** categoria + tipo de ativo + geografia, do nível mais fino com dados suficientes (bairro) subindo quando faltar densidade (→cidade→região). **Cold-start por IA:** sem dados reais, a estimativa vem de **IA** (semeada com dados iniciais coletados), **marcada como estimativa**; conforme transações reais clearam, o **peso da IA decai por volume/confiança** (não por tempo) até sumir — quem manda é o dado real. **Anti-catraca:** mediana sobre janela móvel + rejeição de outlier; **nunca realimentar a faixa com lances que ancoraram nela**. **Vistas:** pro vê a mediana (âncora do lance cego); cliente vê uma faixa (ex.: p25–p75). Sem circularidade — fonte é transação fechada, nunca o que cada lado declara. Parâmetros (janela, método, granularidade mínima, fade da IA) no back-office.
- **R-MATCH.** Propostas ordenadas por **match** (nota + histórico + distância), com "porquê" exibível. Preço só entra como **sinal fraco anti-outlier**. O ranking é **cego à comissão** e cego ao plano. **Plano pago compra só ALCANCE** (raio maior, ver mais trabalhos, notificação prioritária) — **nunca posição** no comparativo de propostas que o cliente vê (decisão R2).
- **R-ACRÉSCIMO.** Acréscimo medido sobre o combinado **original e acumulado**: ≤15% aprovação simples · 15–50% aprovação reforçada com justificativa (motivo+foto) · >50% **re-cotação obrigatória** (pedido pode reabrir). Recusar é fácil e mantém o original; abandonar após recusa = no-show qualificado + penalidade.
- **R-PEÇA.** Peça e mão de obra **sempre cobradas à parte** (separadas). Cada peça tem um **modo de fornecimento**: **(a) pro fornece** — informa o valor na hora, o cliente aprova por esse valor, e a **NF/comprovante é obrigatória antes do REPASSE** da peça (gate de clearing; pode anexar antes); o valor cobrado deve bater com o comprovante; **na divergência vale a NF** — NF menor que o cobrado → diferença **devolvida ao cliente**; NF maior que o valor aprovado → **não pode exceder o aprovado** sem nova aprovação (escopo congelado). **(b) cliente compra** — por escolha do cliente *ou* a **pedido do pro**; nesse caso o pro **especifica a peça** (nome/spec/qtd, opcionalmente foto/onde comprar) e **não cobra por ela** (o cliente paga direto; sem markup nem NF do pro — só mão de obra). (Decisão R3. "A custo" do Legal se mantém enquanto, no modo (a), valor = comprovante.)
- **R-CUSTOMIZAÇÃO (nomes não são fixos).** 3 níveis: (1) apelido livre do usuário; (2) catálogo estruturado **selecionado** (veículo/eletro/imóvel, peças, categorias); (3) config de admin sem deploy. Nenhuma string de domínio hardcoded.
- **R-PERGUNTAS.** Perguntas de esclarecimento (pré-cotação) vêm de um **banco chaveado por tipo de ativo + categoria** e são **bidirecionais**: **pro→cliente** (esclarecimento opcional, P08/C11) e **cliente→pro** (autoradas na criação do pedido). As do cliente podem ser **obrigatórias para o pro propor** (gate de lance). Cada pergunta tem: **origem** (`sistema` fixa / `customizada` por cliente ou prestador / `promovida`); **tipo de resposta** (sim/não, escolha, número, texto); e **flag "solicitar imagem"**. **Imagem é sempre permitida** em qualquer resposta; com o flag ligado, a imagem é **obrigatória** para enviar. Fixas tipadas viram dado (histórico, matching). Customizada recorrente pode ser **promovida** (curadoria do admin). A pergunta esclarece e o resultado volta à proposta — não vira acordo por fora. **Janela:** o fio de perguntas/respostas fica aberto enquanto o pedido está **publicado e não-claimed** — ambos os lados podem perguntar e responder a qualquer momento; ao dar match, o canal migra para o **chat do job**. (Sugestão de perguntas/insights por IA: evolução futura.)
- **R-SPLIT.** Split na hora no caminho bom; retido em disputa/garantia; saque após **clearing**. O repasse de **cada peça** fica retido enquanto sua **NF não for anexada** (estado "comprovante pendente") — não bloqueia o resto do pagamento.
- **R-AVALIAÇÃO.** Mútua: cliente↔prestador.
- **R-ESCOPO.** Escopo congelado; o pedido vale o combinado.
- **R-AGENDA (agendamento & remarcação).** Pedidos podem ser **urgentes** ou **agendados**. No agendado, o cliente escolhe **data + período** (manhã / tarde / noite / madrugada, podendo marcar mais de um); o pro **aceita e seleciona o período** em que vai. **Remarcação é bidirecional:** (a) **pro pede** → cliente **aceita** (troca) ou **não consegue** → pro **cancela** e a walvee pergunta ao cliente se quer **reabrir o mesmo chamado**; (b) **cliente pede** → pro **aceita** (troca) ou **recusa** → cliente **remarca** e o job é **retirado do pro e reaberto** para outros. Remarcação com **≥24h de antecedência** é de boa-fé e não gera penalidade; **menos de 24h conta como no-show** (penalidade ao pro que pede; do lado do cliente, equivale a cancelamento tardio com a taxa pós-match). **Abandono** (sair sem iniciar e sem renegociar) é sempre penalizado. Se o pro pede remarcação com ≥24h e o cliente **não consegue acomodar**, o cancelamento do pro tem penalidade **bem mais leve** que a de abandono (boa-fé). **Máximo de 3 remarcações por job** (anti-enrolação). **Local de atendimento (ativo móvel):** em pedidos de ativo móvel (veículo), o cliente escolhe **na criação** entre **no local** (o pro vai) ou **na oficina** (o ativo vai ao pro). O pro pode **pedir para inverter**; o **cliente aprova** (mesmo padrão de solicitação/aprovação da remarcação).

---

## 4 · Decisões (todas resolvidas)

> Registro das reconciliações entre V5, protótipo, site e jurídico. Nenhum item bloqueia o build; as telas afetadas já estão especificadas com a decisão aplicada.

| # | Conflito | Onde aparece | Opções | Recomendação | Status |
|---|---|---|---|---|---|
| **R1** | App diz "nomeia preço"; site já diz "orçamento" | Tutorial, criar pedido, copy v3 | Alinhar app ao site (orçamento) | Adotar "orçamento/referência" em todo o app | **resolver** (baixo risco) |
| **R2** | "Destaque nas buscas" (plano Pro) vs. ranking cego à comissão | Planos.html; R-MATCH | (a) destaque = só **alcance** (ver mais trabalhos, raio, notificação) — ok; (b) destaque = **posição** no match que o cliente compara — proibido | **DECIDIDO (a):** plano pago compra só alcance, nunca posição. → **Ação de copy:** reescrever "Destaque nas buscas" no Planos.html (ex.: "Mais trabalhos no seu raio", "Raio ampliado", "Notificação prioritária") | ✅ **RESOLVIDO** |
| **R3** | "Peças a custo" (Legal + Planos) vs. preço livre da peça (app) | Legal.html, Planos.html, "Adicionar peça" | (a) forçar a-custo; (b) permitir markup + corrigir texto | **DECIDIDO:** peça **à parte**; prestador informa o valor e o cliente aprova na hora; **NF obrigatória antes do repasse** da peça (gate de clearing), pode anexar antes; valor = comprovante (mantém "a custo"). → **Ação de copy:** Legal/Planos válidos enquanto valor = comprovante | ✅ **RESOLVIDO** |
| **R4** | Admin "novo" vs. console web de Rotas já previsto | Rotas spec | Fundir num back-office único; reusar catálogo | **DECIDIDO:** back-office único (seção 8) que funde curadoria/catálogo do core + console de Rotas; o catálogo de serviços é o mesmo das duas pontas | ✅ **RESOLVIDO** |
| **R5** | Disputa só tem lado do cliente | v3 Layouts | Criar defesa do prestador | **DECIDIDO:** tela `ProviderDisputeDefense` especificada em 6.3 (espelho de `V3Disputa`); a mediação no back-office passa a ver os dois lados | ✅ **RESOLVIDO** |
| **R6** | Sem tela de adicionar/editar ativo | Customer/v3 | Criar telas | **DECIDIDO:** `AddAssetScreen` e `EditAssetScreen` especificadas em 5.5; criação implícita no 1º pedido segue como comportamento do fluxo de criação | ✅ **RESOLVIDO** |

---

## 5 · APP DO CLIENTE

### 5.1 Entrada & conta

**Cadastro · Telefone/E-mail** `SignUpScreen` (`mode: phone|email`) · _Customer/auth_ ✅
- Cria conta; DDD; alterna telefone/e-mail; Google. → Verificar código.

**Login** `LoginScreen` · ✅ — telefone/e-mail, esqueci senha, Google. → Verificar/Home.

**Verificar código** `VerifyScreen` · ✅ — OTP 6 dígitos, reenviar com contador. → Tutorial/Home.

**Tutorial (3 slides)** `TutorialScreen` (`i: 0|1|2`) · ✅
- Primeiro login; pode pular. **Resolvido (R1):** o slide de preço fala em **orçamento de referência** ("você informa seu orçamento — é uma referência, não o preço final; profissionais propõem e você escolhe por nota, histórico e distância"). Nenhum "defina/nomeie o preço" no tutorial. Só copy. → Home.

### 5.2 Pedir ajuda

**Início** `HomeScreen` · ✅ — saudação+avatar, sino, card de pedido ativo, atalhos de ajuda rápida, CTA "pedir serviço", bottom nav.

**Categorias** `CategoriesScreen` · ✅ — Veicular/Casa/Pets + subníveis. **R-CUSTOMIZAÇÃO** (catálogo de admin, não hardcoded).

**Criar pedido · Veicular (3 passos)** `FLOWS.roadside.steps` · _create-flows_ ✅
- P1 problema + **seletor de ativo (veículo)**: lista os veículos do cliente para escolher, ou "adicionar novo" inline; + obs + fotos · P2 localização · P3 confirma. **Resolvido (R1/R-PREÇO):** P3 tem o campo **"Seu orçamento (referência)"** (nunca "preço") + medidor da faixa da região + microcopy "profissionais podem propor acima ou abaixo; você escolhe por nota, histórico e distância"; botão Publicar.
- **Vínculo ao ativo (R6):** o pedido sai sempre ligado a um ativo — existente (consolida histórico, anti-fragmentação) ou novo (criação implícita). → Pedido publicado.
- **Perguntas aos prestadores (opcional, R-PERGUNTAS):** o cliente pode adicionar perguntas que o pro **precisa responder para poder propor** (mesmo modelo: tipo de resposta + flag de imagem). Funcionam como gate do lance (ver P09).
- **Local de atendimento (ativo móvel, R-AGENDA):** o cliente escolhe **no local × oficina**; o pro pode pedir para inverter (cliente aprova).

**Criar pedido · Casa (4 passos)** `FLOWS.home.steps` · ✅
- P1 problema + **seletor de ativo (imóvel)**: lista os imóveis do cliente (casa/apê/condomínio) para escolher, ou "adicionar novo" inline; + fotos · P2 acesso · P3 agendamento (**data + período: manhã/tarde/noite/madrugada**, R-AGENDA) · P4 confirma. **Resolvido (R1/R-PREÇO):** P4 com campo **"Seu orçamento (referência)"** + faixa + mesma microcopy do veicular.
- **Vínculo ao ativo (R6):** pedido sempre ligado a um imóvel existente ou novo. → Pedido publicado.
- **Perguntas aos prestadores (opcional, R-PERGUNTAS):** mesma capacidade do veicular — perguntas do cliente que o pro precisa responder para propor (gate do lance, ver P09).
- _Refinamento futuro:_ imóvel pode conter **equipamentos** (ex.: ar-condicionado) como sub-ativos — selecionar o equipamento específico amarra o histórico no nível certo. Manter no radar (não bloqueia esta versão).

### 5.3 Publica, esclarece, escolhe

**Pedido publicado** `V3PedidoPublicado` · ✅ — aguardando + contagem; stepper Publicado›Propostas›Escolha›Match; reexibe faixa + **orçamento (rotulado referência)**; aviso lance cego; "X vendo"; **fio de perguntas & respostas** (ambos os lados, aberto até o match — R-PERGUNTAS); Editar/Cancelar.

**Profissionais pediram detalhes** `V3PerguntasPendentes` · ✅ — quem perguntou (nome/nota) + o quê; CTA responder.

**Responde ao profissional** `CustomerAnswerInfo` · ✅
- **Resolvido (R-PERGUNTAS):** lista as perguntas do pedido — fixas do banco (por tipo de ativo + categoria) + customizadas do pro — cada uma renderizada pelo seu **tipo de resposta** (toggle sim/não, escolha, número, texto). **Anexar imagem é sempre permitido** em qualquer resposta; nas perguntas com **flag de imagem ligado**, o anexo é **obrigatório** e o envio fica bloqueado sem ele. Respostas viram dado do pedido/ativo.
- **Q&A bidirecional:** além de responder, o **cliente autora perguntas aos prestadores na criação do pedido** (C07/C08); essas podem ser **obrigatórias para o pro propor** (gate no P09). Mesmo modelo (tipo de resposta + flag de imagem).

**Recebe propostas** `RequestDetailScreen` · ✅
- **Resolvido (R-MATCH + R2):** lista **ordenada por match** (nota + histórico + distância), não por preço; preço só como sinal fraco anti-outlier. **Ranking cego à comissão/plano** — nenhum boost pago muda posição. Cada card: nota, distância/ETA, valor, **delta vs. orçamento** ("R$ X acima/abaixo") e linha **"porquê do match"** ("melhor nota da região · 2 km · já fez isso 3× em carros como o seu"). **Propostas acima do orçamento aparecem** (não filtra). Selos: melhor nota / mais barato / dentro do orçamento / **com seguro** (cobertura ativa do pro).

**Detalhe da proposta** `V3PropostaDetalhe` · ✅ — perfil (nota, nº serviços, verificado, **selo "com seguro"** quando cobertura ativa — o que cobre, com a ressalva de que é o seguro do pro); **o que está incluso com peça e mão de obra separadas** (R-PEÇA); histórico na categoria; avaliações; CTA escolher / chat.

**Confirma o profissional (match)** `V3EscolheProposta` · ✅ — resumo final; **slide-to-confirm "R$ X"** (= combinado que congela o escopo). → A caminho.

### 5.4 Serviço acontece

**A caminho** `TrackingScreen` · ✅ — mapa, ETA, progresso; card ligar/mensagem.

**Remarcação (cliente)** `RescheduleFlow` 🆕 (em pedido agendado)
- **Propósito (R-AGENDA):** solicitar alteração de data/horário **ou** responder ao pedido do pro.
- **Elementos:** nova data/período proposta; motivo; ao responder: aceitar (troca) / recusar.
- **Estados:** cliente pede → pro aceita (troca) ou recusa (cliente remarca; job sai do pro e reabre). Pro pede → cliente aceita (troca) ou "não consigo" → pro cancela → prompt "reabrir o mesmo chamado?".
- **Navega:** troca → mantém o job; reabrir → Pedido publicado.

**Acréscimo na chegada** `V3Acrescimo` · ✅
- **Resolvido (R-ACRÉSCIMO):** disparada quando o pro propõe acréscimo (vindo de `ProviderAddSurcharge`). Mostra motivo + fotos + breakdown **combinado original → +acréscimo = novo total**, com o **% acumulado** sobre o combinado e o **selo da faixa**. O controle de aprovação muda por faixa: **≤15%** slide-to-confirm direto; **15–50%** aprovação reforçada (aviso "fora da faixa do combinado" + justificativa do pro em destaque) + slide; **>50%** não aprova aqui → abre **Re-cotação obrigatória** (`RecotacaoScreen`). **Recusar** é botão claro e mantém o combinado original. Percentual sempre **acumulado** (total atual vs. combinado original), nunca por evento.

**Re-cotação obrigatória** `RecotacaoScreen` 🆕
- **Propósito:** quando o acréscimo acumulado passa de ~50% do combinado **ou** o escopo virou outro serviço, o pedido **volta ao estado de proposta** — o cliente revê e decide; o pro no local perde o poder de impor o preço.
- **Elementos:** escopo original × novo (diff); motivo + fotos do pro; breakdown (combinado → novo total, % acima); dois caminhos: **aceitar a nova cotação do pro presente** (slide-to-confirm) ou **reabrir para outros** (republica com o escopo atualizado).
- **Estados:** aguardando decisão · aceita (vira novo combinado) · reaberto (nova janela).
- **Dados:** pedido, combinado original, escopo novo, valor proposto, fotos/motivo.
- **Navega:** aceitar → Em serviço (novo combinado); reabrir → Pedido publicado (escopo novo).

**Libera atendimento** `CustomerJobCode` · ✅ — código/QR confirma presença. → Em serviço.

**Serviço em execução** `V3EmServico` (h≈1180) · ✅
- **Resolvido (R-ACRÉSCIMO + R-PEÇA):** card pro (ligar/mensagem); stepper Aceito›A caminho›Em serviço›Concluído; checklist (concluídos × pendentes); tempo decorrido. **Bloco VALORES** = serviço + peças aprovadas = **total acumulado vs. combinado original** (mostra a distância do combinado e sinaliza peça pendente). **Lista de peças por linha:** aprovada (✓ + horário + valor + badge "comprovante pendente" se a NF não entrou) · aguardando aprovação (em destaque + botão "Aprovar" → abre C19). Peça e mão de obra sempre **separadas**.

**Aprovar peça** `V3AprovaPeca` · ✅
- **Resolvido (R-PEÇA/R3):** dois modos por peça — **(a) pro fornece:** valor informado + breakdown com novo total acumulado; cliente aprova **pelo valor**; **comprovante** aparece quando anexado (badge "comprovante pendente" se ainda não — split retido até a NF, R-SPLIT). **(b) cliente compra** (escolha do cliente ou pedido do pro): em vez de aprovar valor, o cliente vê a **peça especificada** (nome/spec/qtd, foto/onde comprar) e confirma que vai comprar; o pro não cobra pela peça. Peça e mão de obra à parte; entra no histórico com NF + garantia; recusar é barato e não derruba o serviço.

**Pagamento + recibo** `V3PagamentoOk` · ✅ — "concluído"; breakdown discriminado; **split detalhado** (pro × walvee); forma (Pix…)+recibo; CTA avaliar. Reusada após troca de método (ver 5.8).

**Avalia o profissional** `RateScreen` · ✅ — estrelas+tags+comentário+gorjeta; atualiza histórico do ativo.

### 5.5 Ativos / o fosso

**Meus ativos** `AssetsScreen` · ✅ — lista (ícone, identificação, nº registros, último serviço); CTA "Adicionar ativo" → tela 🆕.

**Adicionar ativo** `AddAssetScreen` 🆕
- **Propósito:** caminho explícito para registrar um bem antes de precisar ou cadastrar um segundo bem.
- **Elementos:** **apelido livre** (nível 1 de customização: "Civic do meu pai", "Apê 502"); **tipo via catálogo estruturado** (nível 2, selecionado, não digitado — veículo: marca/modelo de base externa tipo FIPE + placa/ano; eletro: tipo + atributos como BTUs; imóvel: tipo + m²/cômodos); campos específicos por tipo; foto opcional; salvar.
- **Estados:** preenchendo · salvo (abre histórico vazio) · erro de validação.
- **Dados:** tipo (catálogo), atributos por tipo, apelido, foto. **R-CUSTOMIZAÇÃO** (nada de string de domínio hardcoded).
- **Navega:** salvar → Histórico do ativo (vazio).

**Vínculo ao ativo na criação do pedido** (sem tela própria) — no passo 1 de "Criar pedido" o cliente **seleciona um ativo existente** (lista filtrada pelo tipo da categoria: veículo / imóvel / pet) **ou adiciona um novo** inline. Existente → consolida o histórico no mesmo ativo (anti-fragmentação) e o pro vê o histórico antes de cotar; novo → criação implícita. O pedido sai **sempre vinculado a um ativo**. Comportamento do fluxo de criação, não tela.

**Editar / gerenciar ativo** `EditAssetScreen` 🆕
- **Propósito:** manter o ativo ao longo do tempo.
- **Elementos:** renomear apelido; corrigir dados do catálogo; trocar foto; **dar baixa / marcar vendido** → arquiva **mantendo o histórico** (o registro nunca some — é o valor de "Carfax do ativo"); gancho de transferência de histórico (futuro).
- **Estados:** ativo · arquivado/vendido (sai da lista ativa, histórico segue consultável).
- **Dados:** ativo + histórico (read-only após arquivar).
- **Navega:** salvar → Histórico / Meus ativos.

**Histórico do ativo** `AssetDetailScreen` (`id: civic|apto|ar`) (h≈980) · ✅ — topo (nº serviços, total investido, garantias); callout manutenção a vencer; timeline (data, km/cômodo, pro+nota, custo, garantia). **R-CUSTOMIZAÇÃO** (instâncias, não hardcode).

**Detalhe de um serviço** `V3ServicoDetalhe` (h≈1060) · ✅ — cabeçalho+badges; pro (nota+avaliação)+contratar de novo; peças&materiais (inclusos marcados; markup transparente); valores discriminados; comprovantes (NF, fotos); garantia/repetir.

### 5.6 Meus pedidos

**Meus pedidos (listagem)** `V3MeusPedidos` · ✅ — em andamento (status+valor) / anteriores (concluído).

**Detalhe do pedido (abas)** `V3PedidoDetalhe` (`tab: info|props|hist`, `expired: bool`) · ✅
- INFORMAÇÕES (status/resumo/faixa/orçamento/cancelar) · PROPOSTAS (ordenado por match, com delta) · HISTÓRICO (timeline com horários). Estado `expired` → INFORMAÇÕES vira a **decisão** (5.7), PROPOSTAS vazia, HISTÓRICO termina "janela encerrada".

### 5.7 Caminho ruim · não fecha

**Decisão (encerrado)** `V3PedidoDetalhe tab=info expired` · ✅ — "ninguém aceitou R$ X" + faixa; 3 saídas (A subir / B abrir lance / C esperar +30); rodapé Cancelar + ação.

**Saída A · republicado** `V3Republicado` · ✅ — anterior×novo; nova janela.
**Saída B · lance aberto** `V3LanceAberto` · ✅ — lance cego, contagem, lista (nota+valor), selos; CTA escolher.
**Saída C · janela reaberta** `V3JanelaReaberta` · ✅ — +30min, contador; atalhos subir/abrir lance; cancelar.

**Cancelar solicitação** `V3Cancelar` · ✅
- **Resolvido:** resumo do pedido; **política** (grátis se nenhum pro a caminho; taxa após o match); **motivos** (chips: resolvi sozinho, demorou, mudei de ideia, achei outro). **Sem auto-match à revelia** (sobrescreve a V5): se a janela expira sem decisão, o pedido **não fecha nem é cobrado automaticamente** — exige **confirmação explícita** do cliente (cai na tela de Decisão, C29). Nada de "fechar com o melhor avaliado" sem o aval.

**Cancelado · sem custo** `V3CanceladoOk` · ✅ — confirmação R$0; CTA publicar de novo.

### 5.8 Caminho ruim · serviço & cobrança

**Profissional não aparece** `V3NoShow` · ✅
- **Resolvido (R-ACRÉSCIMO + R-AGENDA):** cobre **dois gatilhos** com a mesma remediação (reabre sem custo + penalidade ao pro) e variante de mensagem por caso — **no-show comum** (ETA estourado / sem movimento) e **no-show qualificado** (cliente recusou acréscimo **e** o pro saiu sem check-in). Opções: aguardar +10 / reabrir para outro / cancelar com reembolso (reusa `V3Reaberto`).
- **Off-ramps legítimos do pro (sem penalidade):** **re-cotar** (escopo virou outro) ou **pedir remarcação com ≥24h** (R-AGENDA / `RescheduleFlow`). Remarcação **<24h** e abandono medível caem aqui como no-show.

**Reaberto + reembolso** `V3Reaberto` · ✅ — procurando outro (sem custo); penalidade ao anterior; breakdown do reembolso.

**Disputa** `V3Disputa` · ✅ — escopo congelado; breakdown combinado×cobrado; "o que aconteceu"+evidências; aviso de retenção do split.

**Disputa em mediação** `V3DisputaStatus` · ✅ — pagamento retido; timeline (aberta›análise›resolução ≤48h); falar com walvee.

**Falha de pagamento** `V3FalhaPagamento` · ✅ — cartão recusado; trocar (Pix/cartão/dinheiro); breakdown; tentar de novo.

**Pago após trocar método** `V3PagamentoOk` (reuso) · ✅.

### 5.9 Caminho ruim · pós-serviço

**Garantia / reembolso** `V3Garantia` · ✅ — cobre refazer/reembolso até teto; prazo (ex. 7 dias); refazer (outro pro, sem custo)/reembolso. **Garantia = juiz do serviço/peça desnecessário** (R-ACRÉSCIMO).

**Garantia em andamento** `V3GarantiaStatus` · ✅ — aceita; novo pro designado; timeline; acompanhar.

---

## 6 · APP DO PRESTADOR

### 6.1 Credenciamento

**Tornar-se pro** `ProviderSignUpScreen` · _Pro_ ✅.

**Setup (5 passos)** `PROVIDER_ONB.steps` · ✅ — conta → categorias → área → documentos → enviar.

**Aguardando aprovação (bloqueado)** `ProviderPendingScreen` (light+dark) · ✅ — não trabalha até aprovar (curadoria sustenta cold-start).

### 6.2 Encontrar & propor

**Painel** `ProviderDashboard` · ✅
- **Resolvido (R-ACRÉSCIMO):** online/offline, stats do dia, trabalhos/próximos + **indicador de taxa de acréscimo** do pro vs. **média da categoria**, com sinal visual (dentro do normal / acima / bem acima). Posição discreta e **tom construtivo** (autocalibração, não punição): quem está na média quase não nota; o contraste só destaca quem está fora. Espelha o aviso de cotação do P09 e o sinal de ranking/curadoria do back-office.

**Solicitações próximas · lista** `NearbyScreen` · ✅ — abas Lista/Mapa/Calendário; **vê a média da área, não o orçamento do cliente** (R-PREÇO); cliente verificado.

**Próximas · mapa** `NearbyMapScreen` · ✅ — pins com preço mediano da área.

**Agendadas · calendário** `NearbyCalendarScreen` (h≈1120) · ✅ — agendados sem dono agrupados por datas disponíveis; **ao aceitar, o pro seleciona o período** (manhã/tarde/noite/madrugada, R-AGENDA).

**Perguntar ao cliente** `ProviderRequestInfo` · ✅
- **Resolvido (R-PERGUNTAS):** compositor de perguntas pré-cotação. Mostra as **fixas do banco** por **tipo de ativo + categoria** (toggle para incluir cada uma); botão **+ pergunta customizada** com texto, **tipo de resposta** (sim-não / escolha / número / texto) e **flag "solicitar imagem"** (off = opcional · on = obrigatória no envio); vê o **histórico do ativo** se for da mesma categoria; envia ao cliente.
- Customizada recorrente → **fila de promoção** ao banco fixo (curadoria do admin). **Limite:** o resultado volta à proposta; não é canal para combinar valor por fora. (Sugestão de perguntas por IA: futuro.)

**Enviar proposta (overview)** `ProviderBidScreen` · ✅
- **Resolvido (R-PREÇO + R-PEÇA + R-ACRÉSCIMO + R-PERGUNTAS):** dial ancorado **só à média da área** (lance cego — o pro nunca vê o orçamento do cliente nem o lance de outros). **Define se o valor inclui peças** (vira o "o que está incluso" no cliente; peças sempre discriminadas). **Aviso de cotação:** acréscimo frequente piora o match (par da estatística do P04). **Gate de perguntas do cliente:** se o pedido tem perguntas do cliente, o pro precisa respondê-las (obrigatórias; imagem obrigatória se o flag estiver ligado) **antes de habilitar o envio** — passo dentro do `BID_FLOWS`.

**Fluxos de bid por categoria** `BID_FLOWS.roadside.steps` / `BID_FLOWS.home.steps` · ✅.

**Proposta enviada (status)** `ProviderBidSent` 🆕 (leve) — confirma a proposta enviada, visibilidade ao cliente, editar/retirar. Reusa o shell dos bid-flows.

**Proposta aceita (status)** `ProviderBidAccepted` 🆕 (leve) — cliente escolheu este pro; inicia o atendimento. → A caminho.

**Agenda (propostos + fechados)** `ProviderAgenda` 🆕 — lista os pedidos em que propôs e os serviços fechados; reusa padrões de lista do app. Item do bottom nav do prestador.

### 6.3 Executar & receber

**A caminho / Liberar atendimento (QR)** `JOB_START.steps` + `ProviderVerifyStart` (`mode: scan`) · ✅
- **Resolvido (R-ACRÉSCIMO):** check-in por QR/código libera o início. **Acréscimo antes de iniciar:** se o pro reavalia, abre a composição de acréscimo (`ProviderAddSurcharge`) com a régua de faixas; >50% → re-cotação.

**Composição de acréscimo (pro)** `ProviderAddSurcharge` 🆕
- **Propósito:** o pro monta o acréscimo no local (antes ou durante), que vira o "Acréscimo na chegada" no app do cliente.
- **Elementos:** motivo (texto + **foto obrigatória**); valor; o sistema calcula o **% acumulado sobre o combinado** e mostra em qual faixa cai (≤15 simples / 15–50 reforçado / >50 re-cotação); aviso de que acréscimo frequente piora o match; enviar para aprovação.
- **Estados:** rascunho · enviado (aguarda cliente) · aprovado · recusado (segue escopo original) · >50% → dispara `RecotacaoScreen` no cliente.
- **Dados:** combinado original, acumulado atual, valor, motivo, fotos.
- **Navega:** enviar → aguarda no cliente; recusa → executa o original (ou no-show qualificado se abandonar).

**Trabalho ativo (+ peças)** `ProviderActiveJob` (h≈1340) · ✅
- **Resolvido (R-PEÇA):** fotos antes/depois, notas; lista de **peças & materiais** com **peça e mão de obra sempre separadas** (nunca total fundido), mostrando **modo** (pro fornece × cliente compra) e **status** por linha (aprovada / aguardando / comprovante pendente); botão **"Pedir aprovação · R$ Y"** que leva o valor para a C19 do cliente. É o espelho da C18.

**Adicionar peça (sheet)** `ProviderActiveJob` (`sheet`) · ✅
- **Resolvido (R-PEÇA/R3):** folha onde o pro lança a peça — é onde a **bifurcação de modo acontece, por peça** (não por serviço): no mesmo job ele pode fornecer uma e pedir pro cliente comprar outra. **Pro fornece:** lança o **valor na hora**; peça nasce "comprovante pendente" (NF opcional aqui, obrigatória antes do repasse — split retido até a NF, R-SPLIT). **Cliente compra:** em vez de valor, **especifica a peça** (nome/spec/qtd, opcionalmente foto/onde comprar) e não cobra → vira o estado "comprar peça" na C19. Total mostrado = acumulado vs. combinado. Origem do que vira "Aprovar peça" no cliente.

**Remarcação (pro)** `RescheduleFlow` 🆕 (em job agendado)
- **Propósito (R-AGENDA):** o pro **solicita alteração** de data/horário (dias antes ou no caminho) **ou responde** ao pedido do cliente.
- **Estados:** pro pede → cliente aceita (troca) ou "não consegue" → pro **cancela** → walvee pergunta ao cliente se reabre. Cliente pede → pro aceita (troca) ou **recusa** → job **sai do pro e reabre** para outros.
- **Sem penalidade** quando de boa-fé (não é abandono).

**Avaliar o cliente** `ProviderRateClient` · ✅ — estrelas, tags, cliente preferido (R-AVALIAÇÃO).

**Defesa na disputa (pro)** `ProviderDisputeDefense` 🆕
- **Propósito:** espelho de `V3Disputa` do lado do prestador — o lado que faltava para a mediação ser de mão dupla (R5).
- **Elementos:** notificação de disputa aberta pelo cliente; resumo da alegação (combinado × cobrado + motivo do cliente); campo "minha versão" + **evidências** (fotos antes/depois já capturadas no trabalho ativo, comprovantes de peça/NF, notas do trabalho); enviar defesa.
- **Estados:** aberta · defesa enviada · em análise · resolução (≤48h). Split permanece retido até resolver.
- **Dados:** disputa, alegação do cliente, evidências do pro (reusa fotos/NF do job).
- **Navega:** enviar → status de disputa em mediação (lado pro).

### 6.4 Conta

**Hub da conta** `ProviderAccountScreen` (light+dark) · ✅.
**Editar perfil** `ProviderEditProfileScreen` · ✅.
**Meus serviços** `ProviderServicesManage` (h≈980) · ✅ — serviços+preços-base (semente do cálculo regional em região nova).
**Ganhos & saques** `ProviderEarningsScreen` (light+dark) · ✅
- **Resolvido (R-SPLIT + R-PEÇA):** saldo, ganhos (split) e saques via Pix, com separação visível entre **disponível para saque**, **em clearing** (com data de liberação) e **retido por comprovante pendente** (por peça). Lista das **peças com NF pendente**, cada uma com **atalho para anexar o comprovante e liberar** o repasse daquela peça (granular — não trava o resto). Saque só do que está disponível. Tom **acionável e temporário** ("falta a NF — anexe para liberar"), não punitivo.

---

## 7 · ROTAS (add-on do prestador)

Vertical recorrente (V5 Parte 3). Telas **mobile do técnico** entram no app; o **console web** é back-office (seção 8). Componentes em `walvee-v2-field.jsx` / `-report.jsx` / `-web.jsx`.

- **Início do turno · equipe** — começar turno, definir líder, selecionar equipe ✅
- **Equipamentos do turno** — checklist do material a levar ✅
- **Minhas rotas** — rotas atribuídas ao turno ✅
- **Turno ativo** — resumo do turno em andamento ✅
  _(telas separadas a partir de `V2_FIELD.steps` — split confirmado)_
- **Detalhe da rota** `V2RouteDetail` (timeline) / `V2RouteDetailMapB` (mapa-primeiro) ✅ — duas direções; escolher uma para o final.
- **Ficha do ativo (local)** `V2SiteDetail` ✅ · **Ativo móvel (carro)** `V2AssetVehicle` ✅.
- **Visita em execução** `V2VisitDetail` ✅ · **Adicionar serviço extra** `V2AddService` ✅.
- **Execução guiada** `V2Guided` (`at: 0` leitura / `at: 1` consumível) ✅.
- **Relatório do cliente** `V2ReportScreen` (light+dark) ✅.

**Decisões aplicadas (Rotas):**
- **Modelos de contratação:** (a) **recorrente** — o pro tem agenda fixa (ex.: 1×/semana) no ativo (contrato); (b) **esporádico** — o cliente solicita que alguém faça a rota/visita pontual (on-demand, reusa o fluxo de chamado/propostas).
- **Serviços pré-aprovados:** o cliente deixa certos serviços pré-autorizados; o pro executa **sem aprovação em tempo real**, mas **precisa comprovar a necessidade com fotos** (faturamento posterior com a evidência). Mesma filosofia da garantia/evidência como juiz.

> **Ativo móvel (resolvido):** o **local de atendimento** (no local × oficina) é escolhido pelo cliente na criação; o pro pode pedir para inverter e o cliente aprova (R-AGENDA).

---

## 8 · Back-office / Admin (web — fora do app mobile)

Superfície única (funde V5 Parte 6 + console web de Rotas — decisão R4). **Não é tela do app**, mas o app depende dela (catálogos servidos por backend). Escopo: catálogo de serviços/categorias, catálogo de peças + faixas, banco de perguntas (chaveado por tipo de ativo + categoria, flag de imagem por pergunta, +fila de promoção), aprovação de prestador (curadoria), penalidades & reputação, **mediação de disputas com os dois lados** (`V3Disputa` do cliente + `ProviderDisputeDefense` do pro, R5), config de Rotas/contratos, parâmetros do sistema (faixas de acréscimo, clearing, garantia, janelas). Detalhar em documento próprio de back-office.

---

## 9 · Inventário-mestre (checklist)

### Cliente
| # | Tela | Componente | Status |
|---|---|---|---|
| C01 | Cadastro telefone/email | `SignUpScreen` | ✅ |
| C02 | Login | `LoginScreen` | ✅ |
| C03 | Verificar código | `VerifyScreen` | ✅ |
| C04 | Tutorial (3) | `TutorialScreen` | ✅ |
| C05 | Início | `HomeScreen` | ✅ |
| C06 | Categorias | `CategoriesScreen` | ✅ |
| C07 | Criar pedido veicular | `FLOWS.roadside` | ✅ |
| C08 | Criar pedido casa | `FLOWS.home` | ✅ |
| C09 | Pedido publicado | `V3PedidoPublicado` | ✅ |
| C10 | Pediram detalhes | `V3PerguntasPendentes` | ✅ |
| C11 | Responde ao pro | `CustomerAnswerInfo` | ✅ |
| C12 | Recebe propostas | `RequestDetailScreen` | ✅ |
| C13 | Detalhe da proposta | `V3PropostaDetalhe` | ✅ |
| C14 | Confirma profissional | `V3EscolheProposta` | ✅ |
| C15 | A caminho | `TrackingScreen` | ✅ |
| C16 | Acréscimo na chegada | `V3Acrescimo` | ✅ |
| C17 | Libera atendimento | `CustomerJobCode` | ✅ |
| C18 | Serviço em execução | `V3EmServico` | ✅ |
| C19 | Aprovar peça | `V3AprovaPeca` | ✅ |
| C20 | Pagamento + recibo | `V3PagamentoOk` | ✅ |
| C21 | Avalia o profissional | `RateScreen` | ✅ |
| C22 | Meus ativos | `AssetsScreen` | ✅ |
| C23 | Adicionar ativo | `AddAssetScreen` | 🆕 (5.5) |
| C24 | Editar ativo | `EditAssetScreen` | 🆕 (5.5) |
| C25 | Histórico do ativo | `AssetDetailScreen` | ✅ |
| C26 | Detalhe de um serviço | `V3ServicoDetalhe` | ✅ |
| C27 | Meus pedidos | `V3MeusPedidos` | ✅ |
| C28 | Detalhe do pedido (abas) | `V3PedidoDetalhe` | ✅ |
| C29 | Decisão (encerrado) | `V3PedidoDetalhe expired` | ✅ |
| C30 | Republicado | `V3Republicado` | ✅ |
| C31 | Lance aberto | `V3LanceAberto` | ✅ |
| C32 | Janela reaberta | `V3JanelaReaberta` | ✅ |
| C33 | Cancelar | `V3Cancelar` | ✅ |
| C34 | Cancelado sem custo | `V3CanceladoOk` | ✅ |
| C35 | Não aparece (no-show) | `V3NoShow` | ✅ |
| C36 | Reaberto + reembolso | `V3Reaberto` | ✅ |
| C37 | Disputa | `V3Disputa` | ✅ |
| C38 | Disputa em mediação | `V3DisputaStatus` | ✅ |
| C39 | Falha de pagamento | `V3FalhaPagamento` | ✅ |
| C40 | Re-cotação obrigatória | `RecotacaoScreen` | 🆕 |
| C41 | Garantia / reembolso | `V3Garantia` | ✅ |
| C42 | Garantia em andamento | `V3GarantiaStatus` | ✅ |
| C43 | Remarcação (cliente) | `RescheduleFlow` | 🆕 (5.4) |

### Prestador
| # | Tela | Componente | Status |
|---|---|---|---|
| P01 | Tornar-se pro | `ProviderSignUpScreen` | ✅ |
| P02 | Setup (5 passos) | `PROVIDER_ONB` | ✅ |
| P03 | Aguardando aprovação | `ProviderPendingScreen` | ✅ |
| P04 | Painel | `ProviderDashboard` | ✅ |
| P05 | Solicitações (lista) | `NearbyScreen` | ✅ |
| P06 | Solicitações (mapa) | `NearbyMapScreen` | ✅ |
| P07 | Agendadas (calendário) | `NearbyCalendarScreen` | ✅ |
| P08 | Perguntar ao cliente | `ProviderRequestInfo` | ✅ |
| P09 | Enviar proposta | `ProviderBidScreen` | ✅ |
| P10 | Bid veicular | `BID_FLOWS.roadside` | ✅ |
| P11 | Bid casa | `BID_FLOWS.home` | ✅ |
| P12 | Proposta enviada (status) | `ProviderBidSent` | 🆕 (6.2) |
| P13 | Proposta aceita (status) | `ProviderBidAccepted` | 🆕 (6.2) |
| P14 | A caminho / liberar (QR) | `JOB_START` + `ProviderVerifyStart` | ✅ |
| P15 | Composição de acréscimo | `ProviderAddSurcharge` | 🆕 |
| P16 | Trabalho ativo (+peças) | `ProviderActiveJob` | ✅ |
| P17 | Adicionar peça (sheet) | `ProviderActiveJob sheet` | ✅ |
| P18 | Avaliar o cliente | `ProviderRateClient` | ✅ |
| P19 | Defesa na disputa | `ProviderDisputeDefense` | 🆕 (6.3) |
| P20 | Hub da conta | `ProviderAccountScreen` | ✅ |
| P21 | Editar perfil | `ProviderEditProfileScreen` | ✅ |
| P22 | Meus serviços | `ProviderServicesManage` | ✅ |
| P23 | Ganhos & saques | `ProviderEarningsScreen` | ✅ |
| P24 | Agenda (propostos+fechados) | `ProviderAgenda` | 🆕 (6.2) |
| P25 | Remarcação (pro) | `RescheduleFlow` | 🆕 (6.3) |

### Rotas (provider add-on)
| # | Tela | Componente | Status |
|---|---|---|---|
| R01 | Início do turno · equipe | `V2_FIELD › início` | ✅ |
| R02 | Equipamentos do turno | `V2_FIELD › equip.` | ✅ |
| R03 | Minhas rotas | `V2_FIELD › rotas` | ✅ |
| R04 | Turno ativo | `V2_FIELD › ativo` | ✅ |
| R05 | Detalhe da rota | `V2RouteDetail` / `…MapB` | ✅ escolher 1 |
| R06 | Ficha do ativo (local) | `V2SiteDetail` | ✅ |
| R07 | Ativo móvel | `V2AssetVehicle` | ✅ |
| R08 | Visita em execução | `V2VisitDetail` | ✅ |
| R09 | Adicionar serviço extra | `V2AddService` | ✅ |
| R10 | Execução guiada | `V2Guided` | ✅ |
| R11 | Relatório do cliente | `V2ReportScreen` | ✅ |

---

## 10 · Pendências (não bloqueiam telas)

- **Ações de copy no site** ✅ — "Destaque nas buscas" reescrita como **"Avisos prioritários de novos trabalhos"** (alcance, não posição — R2) em Planos.html, Landing.html e Landing standalone. "Peças a custo" no Legal/Planos **mantida** (válida enquanto valor = comprovante — R3, "vale a NF").

_Todas as decisões de produto e as ações de copy estão fechadas. Resta o trabalho de build: as **telas 🆕** (seção 9)._

---

## 11 · Evolução futura (fora do escopo de build V5)

**Integração com fornecedores de peças.** Hoje a peça é digitada (valor) + NF anexada antes do repasse (R3). No futuro, integrar com fornecedores cadastrados para que a peça venha pronta. Resolve R3 na raiz e conecta-se a três mecanismos já existentes:

- **R3 / comprovante:** peça de fornecedor integrado nasce com **preço + NF automáticos**, batendo por construção — sem reconciliação, sem "comprovante pendente", sem foto manual.
- **Faixa de referência da peça** (fonte de cold-start): catálogo de fornecedor dá preço real de mercado, não auto-declarado.
- **Acréscimo:** preço/disponibilidade de peça visível **antes/durante a cotação** → cotação mais fiel → menos acréscimo no local.

Fases: (1) **catálogo/descoberta** — preço de referência só para consulta do pro, sem transação; (2) **compra integrada** — peça pronta (preço + NF auto), um toque para adicionar; (3) **sourcing** — preços/disponibilidade de fornecedores **perto do pro**, pedido pela walvee, preço negociado por volume (benefício de plano do tipo *alcance*).

**Regras inegociáveis para não quebrar "a custo":**
- Receita da walvee vem de **rebate B2B do fornecedor**, nunca de markup somado ao preço pago pelo cliente — o cliente paga o preço de catálogo.
- **Opcional:** o pro pode usar fornecedor próprio e o cliente pode levar a própria peça; integração é o caminho fácil, não obrigatório.
- **Disponibilidade real:** não exibir preço de peça sem estoque confirmado.

---

**Sugestão de perguntas / insights por IA.** Sobre o banco de perguntas (R-PERGUNTAS): a IA propõe perguntas de esclarecimento ou insights conforme tipo de ativo + categoria + histórico, que o pro (ou o admin, via promoção) aceita. Acelera a cotação fiel e enriquece o banco. Sugestão assistida, decisão humana.

---

**Seguro de responsabilidade para o pro (oferta via parceiro).** A garantia cobre refazer/reembolsar até o valor do serviço, mas não dano à propriedade acima disso. Direção: a walvee **oferta seguro de RC** aos pros via **parceiro segurador** (walvee é distribuição, não seguradora — sem risco de sinistro no balanço), idealmente com taxa de grupo; cobre dano ao bem do cliente acima do valor do serviço. **Decidido: tudo opt-in** (sem mandato, mesmo em categorias de risco), mas o pro com cobertura ganha um **selo "com seguro" visível ao cliente** na proposta — o mercado puxa a adoção (igual ao "verificado"). Copy deve refletir **cobertura ativa** e que é o seguro **do pro** (walvee não garante). _(Empacotamento — avulso/anual/por-job — é detalhe da integração com o parceiro.)_

---

_Fonte do comportamento: walvee Especificação V5. Fonte da UI: protótipos walvee Customer / Pro / v3 Cliente / v2 Rotas. As reconciliações com a V5 estão todas aplicadas; o trabalho de build restante são as **telas 🆕**._
