# Praça e vertical de lançamento

**Decisão:** socorro veicular, em São José do Rio Preto (SP).
**Data:** 22/07/2026 · **Fecha:** [MKT-STRAT-01 (#138)](https://github.com/raul1934/services-marketplace/issues/138)

## O que estava errado

A landing prometia quatro verticais (veicular, casa, beleza, pets — 24 serviços)
em "todo o Brasil", antes de existir liquidez em lugar nenhum.

É o modo conhecido de matar um marketplace pré-lançamento. Com a demanda
espalhada por 24 serviços e 5.570 municípios, a chance de haver um profissional
disponível no primeiro pedido de alguém é próxima de zero. E a primeira
experiência ruim não tem segunda chance: quem pede socorro e não recebe proposta
não volta, e ainda conta para os outros.

Uber lançou uma cidade, um serviço. iFood começou por restaurante em São Paulo.

## Por que socorro veicular

- **Urgência máxima.** Pneu furado às 23h não adia para amanhã. Isso sustenta o
  preço e perdoa imperfeição de produto — ninguém desinstala o app que resolveu.
- **Nenhum incumbente compete.** GetNinjas, Triider e Habitissimo são fluxo de
  orçamento assíncrono, de dias. Socorro na estrada hoje é seguradora ou Google
  Maps.
- **O rastreamento em tempo real importa de verdade.** Em beleza ou pet, ver o
  profissional no mapa é enfeite; aqui é a diferença entre esperar e desesperar.
- **É a vertical que dá sentido ao histórico de ativo.** O carro é o ativo mais
  natural para registrar manutenção — e é o gancho de recorrência do produto.

## Por que São José do Rio Preto, e não São Paulo

A recomendação inicial da auditoria era São Paulo capital. Foi revista ao saber
que a operação está em Rio Preto (DDD 17).

Nos primeiros 90 dias, conseguir oferta é trabalho de campo: bater em oficina,
auto center e ponto de guincho, conversar, cadastrar na hora. Presença física é
a maior vantagem disponível nesse estágio, e ela não escala por e-mail.

| | Rio Preto | São Paulo |
|---|---|---|
| População | ~480 mil | ~12 milhões |
| Oferta para cobertura útil | **~40** profissionais | ~200 |
| Aquisição de oferta | presencial, porta a porta | mídia paga e parcerias |
| Tempo até liquidez | semanas | meses |
| Custo de um chamado sem proposta | baixo | alto, e mais gente vendo |
| Chance de ser *o* app da cidade | real | nenhuma |

Volume absoluto menor é o preço, e é um preço que vale pagar: um marketplace que
funciona numa cidade é um negócio; um que quase funciona em vinte não é nada.

Expansão natural depois: Araçatuba, Bauru, Ribeirão Preto — praças da mesma
região, alcançáveis pela mesma rede.

## Metas antes de abrir

| Métrica | Meta |
|---|---|
| Profissionais verificados em Rio Preto | **40** |
| Cobertura por turno (inclusive madrugada) | sem buraco |
| Leads de cliente na praça | 300 |
| Taxa de match simulada | > 70% |

**A taxa de match é a métrica que decide se o negócio existe.** Chamado sem
proposta é churn permanente mais boca a boca negativo. Ela vem antes de GMV,
antes de CAC, antes de qualquer outra coisa.

## O que mudou na landing

- Hero fala de socorro veicular em Rio Preto, não de "gestão de manutenção de
  ativos no Brasil".
- A grade de serviços mostra só a vertical de lançamento. Casa, beleza e pets
  viram uma faixa "em breve" — sem CTA próprio e **sem prometer data**.
- Título, description, Open Graph e o `areaServed` do JSON-LD passaram a nomear a
  cidade. Busca de socorro é intenção local; ranquear para "guincho rio preto"
  vale mais do que para "guincho" em geral.
- FAQ diz qual é a primeira cidade e que a ordem das próximas sai da lista.
- O seletor de serviço do formulário **continua com tudo**. Quem procura
  encanador deve conseguir dizer isso: é esse sinal que decide qual vertical abre
  a seguir.

`LAUNCH_TYPE` em `landing/index.html` é o único lugar que define a vertical em
destaque. Trocar o valor muda o foco da página.

## Quando reabrir a discussão

- 40 profissionais ativos e taxa de match acima de 70% por quatro semanas
  seguidas → abrir a segunda vertical **ou** a segunda praça, nunca as duas ao
  mesmo tempo.
- Se a lista de espera mostrar uma cidade fora da região com massa muito maior
  que Rio Preto, a ordem de expansão muda — mas só a de expansão, não a do
  lançamento.
