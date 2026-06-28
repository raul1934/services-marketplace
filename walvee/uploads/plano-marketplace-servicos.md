# Rede Credenciada de Serviços — Documento de Conceito

> Versão de trabalho. Consolida as decisões tomadas até aqui e deixa explícitas as escolhas
> que ainda precisam de resposta. Não é um plano fechado — é a base para validar.

---

## 1. O que é, em uma frase

Uma plataforma que conecta quem **precisa** de serviços para casa, condomínio e veículo
a prestadores **curados e contratados**, com preço transparente e um **histórico de ativos
e manutenções** que faz o cliente voltar.

A diferença para um grupo de Facebook ou um classificado: aqui os prestadores são
**selecionados na entrada**, há **garantia** sobre o serviço, e a plataforma guarda o
histórico do que foi feito em cada bem (casa, carro, equipamento).

---

## 2. Proposta de valor — as duas pontas

**Para quem oferece (prestador):**
- Leads qualificados de gente com intenção real de contratar.
- Acesso a uma base de clientes sem precisar gastar com anúncios.
- Selo de credenciado — diferenciação contra o mercado informal.

**Para quem precisa (cliente):**
- Prestadores **verificados e garantidos** pela plataforma (reduz o medo de deixar um
  estranho entrar em casa ou mexer no carro).
- **Preço de referência** por região — proteção contra ser cobrado a mais.
- **Histórico de ativos e manutenções** — registro do que cada bem já recebeu e quando.

O histórico é o **fosso** do negócio: transforma transação única em relacionamento
recorrente e combate a desintermediação (cliente e prestador fecharem por fora).

---

## 3. Verticais e faseamento

A mesma plataforma serve verticais diferentes, mas o *go-to-market* de cada uma é distinto.
A ordem importa: começar onde a aquisição é barata e o ticket sustenta o modelo.

| Fase | Vertical | Cliente | Aquisição | Ticket | Valor do histórico |
|------|----------|---------|-----------|--------|--------------------|
| 1 | Casa (PF) + Veículo | Pessoa física | Grupos / busca local | Baixo | Médio |
| 2 | Condomínio | Síndico / administradora | Prospecção B2B | Alto | Alto (manutenção obrigatória) |
| 3 | Equipamento / Frota | Empresa | Venda B2B ativa | Alto | Altíssimo (lock-in) |

**Princípio:** conforme se avança nas fases, o valor de retenção sobe, mas o canal de
aquisição muda (de comunidade para venda ativa). Não tratar tudo como um só motor.

Recorrente vs. avulso: o **avulso** é porta de entrada (volume, cadastra o ativo); o
**recorrente/periódico** é o que retém e monetiza.

---

## 4. Como funciona a transação

1. O **cliente nomeia um preço** para o serviço que precisa (ex.: R$120).
2. A plataforma mostra uma **faixa de referência** da região antes de ele confirmar, para
   o valor não sair irreal.
3. Os **prestadores curados** veem o pedido e podem **aceitar o valor** (sem leilão).
4. Os lances dos prestadores são **cegos** — nenhum vê o do outro.
5. O **cliente escolhe** entre os que aceitaram, avaliando por **nota, histórico, distância,
   tempo de resposta e verificação** — nunca só por preço.
6. Se ninguém aceita o valor nomeado, abre-se a etapa de lance (plano B).

**Travas de design já decididas:**
- Lance cego entre prestadores (evita a guerra de preço visível).
- Preço nunca aparece sozinho — sempre ao lado de reputação.
- Limite de prestadores na escolha (ex.: 3 a 5) e **janela curta** para o cliente decidir;
  se não decidir, fecha com o mais bem avaliado.

**Pontos de atenção desta mecânica:**
- O **anchor do cliente** vira o filtro de qualidade — daí a faixa de referência ser
  essencial, não opcional.
- O preço nomeado precisa estar **amarrado a um escopo claro**, para evitar o
  "aceitei R$120 e depois cobro R$200" (bait-and-switch → disputa).
- **Cold-start do prestador novo:** se o cliente sempre escolhe pela maior nota, o novato
  bom nunca pega o primeiro serviço. Mitigado pela curadoria (que já é selo de confiança)
  + sinais além da nota.

---

## 5. Modelo de receita

- **Comissão de 1% a 5%** sobre o serviço, com **piso por transação**
  ("5% ou R$X, o que for maior") para o serviço pequeno não dar prejuízo.
- A **taxa de cartão é absorvida pelo prestador** (ou embutida no preço) — a comissão
  fica limpa. *Tornar a taxa visível para o cliente quando aplicável, para não quebrar a
  promessa de preço transparente.*
- **Pagamento via split** — o dinheiro **não passa pela conta da plataforma**: cada parte
  recebe direto (prestador o líquido, plataforma a comissão). Usar provedor licenciado
  (ex.: Pagar.me, Mercado Pago, Stone, Asaas, Iugu, Celcoin). Isso evita virar instituição
  de pagamento e evita bitributação.

**Realidade da margem:** 3% de R$200 = R$6. "Ganhar no volume" só vale **depois** de
provar margem de contribuição positiva por transação e resolver a liquidez dos dois lados.
Pernas de receita que não dependem do volume desde o dia 1:
1. Piso por transação.
2. Receita recorrente do prestador (assinatura ou lead pago).
3. Verticais de ticket alto (condomínio, frota).
4. O histórico como produto pago.

> A **garantia/curadoria justifica comissão maior** — confiança é o que as pessoas pagam
> caro. A curadoria que custa caro é a mesma que deixa cobrar caro.

---

## 6. Camada de confiança (o diferencial)

- **Curadoria na entrada:** cada prestador é avaliado e aprovado antes de entrar
  (documento, antecedentes, comprovação de experiência, habilitação para atividades
  regulamentadas como elétrica e gás).
- **Contrato** com cada prestador credenciado.
- **Garantia** ao cliente — definida em número, não em "garanto que é bom".
- **Avaliação contínua + descredenciamento:** o filtro de entrada não basta; quem cai de
  qualidade precisa poder sair sem virar briga.

**Cuidados sérios (levar a advogado e a corretor de seguros):**
- A palavra "garanto" move a responsabilidade do prestador para a plataforma. Contrato
  só ajuda se o prestador tiver como pagar — daí a importância de **seguro de
  responsabilidade civil** (do prestador ou guarda-chuva da plataforma).
- Definir **o que a garantia cobre** com teto (devolução? refazer? até quanto?).
- **Risco de vínculo empregatício:** curar, controlar preço, avaliar e garantir pode gerar
  alegação de vínculo. Contrato precisa deixar a autonomia clara — e a operação real tem
  que bater com o papel.

---

## 7. Riscos e decisões em aberto

**Decisões ainda não fechadas:**
- De onde vem a faixa de preço de referência no dia 1 (cold-start de dados)?
- O que exatamente "aceitar" significa para o prestador — compromisso firme ou interesse?
- O que a garantia cobre, com teto em reais?
- Quem arca com estorno/chargeback quando o cliente alega serviço ruim?
- Qual o checklist verificável de curadoria por tipo de serviço?

**Riscos estruturais:**
- **Liquidez (ovo e galinha):** ter prestador e cliente na mesma região ao mesmo tempo.
- **Margem fina** em serviços de ticket baixo.
- **Escala da curadoria:** aprovação humana é lenta e cara — o gargalo vira quantos
  prestadores você aprova por semana.
- **Escopo crescente:** quatro verticais + pagamentos + curadoria + garantia. Tudo encaixa
  no papel; o risco é construir tudo antes de testar com gente real.

---

## 8. Próximo passo — o teste mínimo

Antes de construir plataforma, contrato bonito e app: **provar o fluxo uma vez, na mão.**

- **Um** serviço, **uma** cidade.
- Credenciar **5 prestadores** manualmente (acordo simples, sem sistema).
- Conseguir **1 cliente pagante** passar por todo o fluxo:
  nomeia preço → vê os prestadores curados → escolhe → serviço acontece → comissão entra.

Se funcionar uma vez de forma manual e feia, o negócio está provado e vale construir o
sistema. Se não funcionar nem manualmente, nenhum contrato ou app conserta.

**Definir para o teste:**
- Qual serviço? _______________
- Qual cidade? _______________
- Qual lado recruto primeiro (provavelmente prestador)? _______________

---

*Aviso: este documento não é aconselhamento jurídico nem financeiro. Pontos de
pagamento, contrato, garantia, seguro e vínculo devem ser validados com advogado e
contador antes de operar.*
