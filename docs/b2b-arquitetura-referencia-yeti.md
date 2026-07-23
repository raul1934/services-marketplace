# B2B: arquitetura de referência a partir do Yeti

**Status:** modelo de referência. Nenhuma linha de código de produto até a
validação (ver "Gate", ao fim). Complementa e **corrige** `estrategia-b2b.md`.

**Data:** 23/07/2026

## Por que este documento existe

O Yeti / First Choice é um app de operação de serviço de campo em produção
(Ionic/Angular + Capacitor, backend Laravel, whitelabel de várias marcas). Não é
nosso — é **referência**. Analisado como Product Owner, ele revelou ser uma
implementação madura e testada de exatamente o modelo de ordem de serviço com
contrato que `estrategia-b2b.md` levantou como hipótese.

Este documento registra o que o Yeti prova, o modelo de domínio corrigido, as
opções de arquitetura e a decisão de **adiar a escolha até a validação**. Serve
para que, no dia em que a validação passar, o desenho já esteja pensado.

## A correção que o Yeti forçou

`estrategia-b2b.md` diz: *"falta só `Organization` e `Contract`, o resto já
existe"*. **Isso subestima muito o gap.**

O centro do B2B não é o `ServiceRequest` do marketplace, nem o formulário de
inspeção. É um **modelo de cobrança por catálogo, escopado por empresa**:

- **Company** é dona de todos os catálogos: **Service**, **Equipment**
  (+categorias), **Consumable** (+categorias), **Form**. Cada empresa define os
  seus.
- **Service** é a unidade cobrável de trabalho — ancora tudo.
- **Equipment** vinculado a um service é cobrado **por visita** ou **por tempo
  (hora)**.
- **Consumable** é **sem custo** (embutido no contrato) ou **cobrado à parte**.
- **Form** é apenas *uma coisa que o Service pode exigir* — uma folha, não a
  espinha. Foi meu erro tê-lo colocado como a peça central.
- **Site** pode ter **serviços obrigatórios**, performados em toda visita.

A **medição mensal** não é "somar chamados". É, por visita:

```
serviços performados
  × equipamento (por visita ou por hora)
  + consumíveis (uns grátis, uns cobrados)
= valor da visita  →  somado no mês por contrato
```

**É essa sofisticação de cobrança que a administradora paga para ter.** Não a
foto, não o form — a medição itemizada e defensável.

## O que o Yeti prova (mapeamento)

| Yeti (existe, em produção) | Chama Fácil — condomínio |
|---|---|
| `ICompanyContract` (company ↔ contractor) | Administradora ↔ prestadora |
| `ISite` (local com geofence, recorrente) | O condomínio |
| Rota → visita agendada | Manutenção mensal |
| `ISitePerformance` (foto before/after + geo) | A ordem de serviço / comprovação |
| `IService` (`hourly_service`, `charge_id`) | Serviço cobrável do catálogo |
| `IEquipment` (`customer_rate`, `contractor_rate`, `duration_hours`) | Equipamento por visita/hora |
| `IConsumable` (`rate`, `quantity`) | Consumível grátis/cobrado |
| `IFormPerformance` (form dinâmico) | Checklist opcional do serviço |
| `ISiteService` (`requirement`) | Serviço obrigatório do site |
| Billing por contrato (ChargeOver) | Medição mensal |
| `customer_rate` **e** `contractor_rate` | Cobrança de dois lados |

## O modelo de domínio corrigido

A espinha, do catálogo à cobrança:

```
Company (dona dos catálogos)
  ├── Service      (unidade cobrável; pode exigir Equipment/Consumable/Form)
  │     ├── Equipment   (por visita | por hora)
  │     ├── Consumable  (grátis | cobrado)
  │     └── Form        (checklist opcional)
  ├── Contract     (Company ↔ prestadora)
  └── Site         (condomínio; tem serviços obrigatórios)
        └── ServiceOrder   (a visita performada: foto+geo+serviços+form)
              └── Medição   (rollup mensal por contrato)
```

## Dois lados, movimento de dinheiro faseado

Decidido: cobrança de **dois lados** — cobra do contratante a um `customer_rate`,
paga a prestadora a um `contractor_rate`, a diferença é a margem da plataforma.

**Consequência crítica, que precisa estar à vista:** cobrar de um lado e pagar o
outro, com margem, **é intermediação de pagamento de marketplace**. É o mesmo
blocker do CNAE (reparação de computadores) + MEI já registrado como pendência
para o B2C — o MEI não comporta isso, e precisa de contador / entidade jurídica
adequada antes de ligar.

Ou seja: a vantagem de "receita de licença de software, mais simples que
take-rate" **desaparece** se a cobrança de dois lados movimenta dinheiro desde o
começo.

**Mitigação — separar o modelo do movimento:**

- **O modelo de dados guarda os dois rates desde o dia 1** (como o Yeti). Não
  trava nada.
- **O dinheiro começa de um lado só:** cobra a licença/medição da administradora
  (sem tocar no repasse à prestadora) e liga o "dinheiro no meio" só quando a
  entidade jurídica existir — o mesmo gate do take-rate B2C.

Assim projeta-se dois lados e opera-se um, sem ficar bloqueado.

## Origem da prestadora: híbrida (o flywheel)

Decidido: **híbrido** — o contrato usa vendors próprios da administradora e cai
para o marketplace quando falta cobertura para um serviço obrigatório. Esse
fallback é o mesmo padrão da fila de resgate (MKT-OPS-01 / #156), só que
proativo.

O que isso desbloqueia, e é o argumento mais forte de todos para fazer o B2B:

- O **mesmo `ProviderProfile` serve os dois lados** — não há pool separado. O
  provider ganha um estado: *"de dentro do contrato"* (vendor preferido) ou *"de
  fora"* (marketplace).
- Os **contratos B2B criam demanda recorrente garantida** que semeia a oferta do
  marketplace.
- A **oferta do marketplace faz backstop dos contratos** quando o vendor próprio
  falha.

**Não é um segundo produto. É o que torna o primeiro viável** — o B2B traz
oferta e receita previsível, o B2C usa essa oferta, cada lado cobre o buraco do
outro.

## Três opções de arquitetura

### A — camada fina sobre `ServiceRequest` · **descartada**

`Organization` + `Contract` + `ServiceRequest.contract_id`. Parece a mais barata
(era o que `estrategia-b2b.md` sugeria). Mas o marketplace tem `budget_max` único
e proposta/leilão; **não tem** catálogo de service/equipment/consumable por
empresa, nem cobrança por visita/hora. O modelo de cobrança não cabe aqui.

### B — módulo B2B isolado · **recomendada**

Contexto separado no mesmo backend, espelhando o Yeti enxugado: `Organization`,
`Contract`, `Site`, `Service` + catálogos (`Equipment`, `Consumable`, `Form`),
`ServiceOrder`, `Medição`. Não toca no `ServiceRequest`, mas **compartilha o
`ProviderProfile`** para sustentar o híbrido.

É a única que respeita o modelo de cobrança. É "dois produtos, uma plataforma"
feito com disciplina — a complexidade B2B nunca polui o B2C on-demand.

### C — portar a prova (form) primeiro · **descartada**

Extrair o motor de inspeção como primeira peça. Errado: o form é folha do
service, não a espinha. Liderar por ele é telhado antes da parede.

## O que NÃO trazer do Yeti

Crew, rotas, a hierarquia turno→rota→site→serviço, geofencing pesado, whitelabel,
ChargeOver. É maquinário do modelo de neve (operadores empregados, turnos, crews
de campo) — não do condomínio. Importar isso repete a armadilha das quatro
verticais: complexidade que serve o modelo do Yeti, não o nosso.

## Superfície de app

Três atores, que **não são** os apps de marketplace:

- **Síndico e gestor da administradora → painel web** (Filament, que já existe).
  Estão numa mesa, uma vez por mês.
- **Prestadora → app do provider atual**, com um modo "ordem de contrato", ou web.

Sem app novo para o beachhead de 2-3 administradoras.

## Gate

**Nada disso se constrói antes das 5 conversas diagnósticas** (ver
`estrategia-b2b.md`, seção "O que fazer antes de escrever código"). O critério:
**3 de 5 conversas dando um número de "quanto pagaria por mês"** → aí sim se
escolhe a opção (provavelmente B) e um plano de implementação à parte é escrito.

Construir o módulo B2B — ainda mais rico do que se imaginava — antes de saber que
alguém paga é o erro de publicar faixa de preço inventada, em escala de trimestre.
