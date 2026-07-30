# A ponta B2B: software de ordem de serviço antes do marketplace

**Status:** hipótese não validada. Nada a construir até as conversas da seção
"O que fazer antes de escrever código".

**Data:** 22/07/2026

## A ideia

Empresas que já têm contrato de manutenção com outras empresas usam a Chama
Fácil para **registrar e comprovar o serviço prestado**. A plataforma entra como
ferramenta de operação, não como fonte de demanda.

Com o tempo, essas mesmas empresas — que já têm equipe, veículo e capacidade —
recebem oportunidades de serviço avulso da rede.

## Por que isso tem nome e histórico

É o padrão **"venha pela ferramenta, fique pela rede"**. Toast entrou nos
restaurantes como PDV e virou delivery. OpenTable entrou como software de
reserva e virou rede de clientes. ServiceTitan e Housecall Pro fizeram o mesmo em
serviços de campo.

O que todos têm em comum: **resolveram uma dor operacional real do lado da
oferta antes de existir qualquer demanda**. A rede veio depois, em cima de uma
base que já dependia da ferramenta.

## O que já está construído

Conferido no código em 22/07/2026. A parte difícil de uma ordem de serviço —
**provar que o serviço foi feito** — já existe:

| Primitiva | Modelo |
|---|---|
| Fotos de antes e depois | `Media` (morph em `ServiceRequest`) |
| Código de entrada e de início | `entry_code`, `start_code` |
| Carimbo de aceite, início e conclusão | `accepted_at`, `started_at`, `completed_at` |
| Peças usadas, com aprovação | `JobPart` |
| Andamento do serviço | `JobUpdate` |
| Avaliação, disputa e garantia | `Review`, `Dispute`, `WarrantyClaim` |
| Territorialidade | `Market` |

## O que falta

**Um conceito só: empresa e contrato.** Hoje cliente é sempre `User` pessoa
física — não há `Organization`, `Contract` nem nada equivalente.

Escopo mínimo, se validar:

- `Organization` — a empresa contratante
- `Contract` — o vínculo entre contratante e prestadora, com escopo e vigência
- `ServiceRequest` pertencendo opcionalmente a um contrato
- Relatório mensal por contrato: serviços, evidências, peças, valores

Todo o resto já existe.

## Por que encaixa aqui, especificamente

**1. O produto já é 80% disso.** Não é produto novo; é uma camada de organização
sobre o que está pronto.

**2. Resolve o ovo e a galinha pelo lado certo.** Empresa com contrato já tem
operação rodando — ela não espera demanda nossa, tem a dela. Vira oferta
disponível no dia em que o B2C abrir, sem que a gente tenha prometido nada a
ela.

**3. Gera receita antes da liquidez, e sem intermediar pagamento.** Este ponto é
concreto e não teórico: o CNAE atual é reparação de computadores, e o MEI não
comporta intermediação de pagamento de marketplace — isso está registrado como
pendência para um contador antes de ligar a cobrança do B2C. **Licença de
software é receita de natureza diferente**, e chega antes da liquidez existir.

**4. Rio Preto tem esse mercado.** Região agro forte: cooperativas, usinas,
transportadoras, distribuidoras, locadoras, administradoras de condomínio. Todas
contratam manutenção, e quase todas comprovam serviço em papel, planilha ou
WhatsApp.

## O risco, sem maquiagem

**É um segundo produto, com ciclo de venda diferente.** B2B tem reunião,
proposta, onboarding, suporte e pedido de relatório customizado. B2C on-demand
tem instalação e uso.

Tocar os dois ao mesmo tempo é a mesma armadilha das quatro verticais que a
decisão de praça desmontou — e pela mesma razão: atenção dividida em pré-produto
não produz metade de cada, produz nada dos dois.

**A pergunta certa não é "além do B2C?". É "em vez de, por enquanto?".**

## Uma correção de rota sobre posicionamento

O hero original dizia *"gestão de manutenção de ativos"* e a auditoria trocou por
linguagem B2C, com o argumento de que é vocabulário de SaaS para quem está com
pneu furado na Paulista.

Isso continua certo **para a home**. Mas o problema nunca foi o vocabulário — era
o **lugar**. Se o B2B virar a ponta de entrada, aquela linguagem está correta:
numa página `/empresas`, com público, copy e funil próprios — exatamente como
`prestadores.html` foi separada da home.

## O que fazer antes de escrever código

O produto já dá para **demonstrar**. Fale com cinco empresas de Rio Preto que
contratam manutenção e pergunte:

1. **Como você comprova hoje que o serviço foi feito?**
   A resposta esperada é papel, WhatsApp ou planilha. Se for um sistema que já
   funciona bem, a dor não existe e a hipótese morre aqui.
2. **O que você precisa ver no fim do mês para aprovar o pagamento do
   fornecedor?**
   Isso desenha o relatório. Não invente o formato — copie o que ela descrever.
3. **Quem assina esse aceite?**
   Define quem é o usuário real. Quase nunca é quem assina o contrato.
4. **Quanto você pagaria por mês para isso deixar de ser papel?**

**A quarta é a única que importa.** As três primeiras existem para chegar nela
sem parecer venda.

### Critério de decisão

- **Três das cinco darem um número** → há negócio. Vale desenhar `/empresas` e o
  escopo mínimo.
- **Menos que isso** → arquivar este documento e seguir com o B2C. Sem ressaca.

Anote as respostas literais, inclusive as ruins. Cinco conversas viram amostra;
lembrança de cinco conversas vira viés de confirmação.

## O que não fazer

- Construir `Organization` e `Contract` antes das cinco respostas. Construir B2B
  sem saber quanto alguém paga é o mesmo erro de publicar faixa de preço
  inventada: parece progresso e ancora a decisão no lugar errado.
- Prometer prazo ou funcionalidade nas conversas. São entrevistas, não vendas.
- Deixar o B2C parado enquanto isso. As conversas são cinco cafés, não um
  trimestre — e a prospecção de guincheiros pode acontecer na mesma semana, às
  vezes na mesma rua.
