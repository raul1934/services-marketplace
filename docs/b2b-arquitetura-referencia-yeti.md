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

### Eixo de execução do operador (correção)

`estrategia-b2b.md` e a primeira versão deste doc puseram **turno→rota→crew** em
"não trazer do Yeti". **Errado nas três.** A operação é field-service de verdade —
o modelo do Yeti quase inteiro, menos o que é mesmo dispensável (whitelabel,
ChargeOver, geofencing pesado). O operador **inicia um turno (shift), depois uma
rota**, e o trabalho é de uma **equipe (crew)**. Ortogonal ao catálogo:

```
Shift (turno)  →  Route (rota)  →  parada = Site / ServiceOrder
   ▲ da crew        ▲ da crew         ▲ vários membros editam a mesma OS
```

- **Turno e rota são da equipe.** Um membro é **líder**, os outros são membros.
  Despacho e configuração podem ser **setados por rota**.
- **Cada membro é usuário do app, no próprio celular.** Entra, e **adiciona
  serviços à `ServiceOrder` em andamento** — vários celulares editando a mesma
  visita ao mesmo tempo. O líder também pode **adicionar e atribuir** um serviço a
  um membro.
- **Cada serviço registra o autor** (quem executou). Isso não é enfeite: no
  `por hora`, a hora é **de quem fez** — atribuição é o que torna a medição por
  tempo defensável quando a equipe é mista.

**Consequência de arquitetura (crew + offline-first):** o sync **não pode** ser
"último a salvar vence" na OS inteira. Cada serviço/foto é um item com **autor +
UUID gerado no cliente**; o merge é **por item** (append/aditivo), no espírito dos
jobs idempotentes já documentados. Dois membros offline fecham partes da mesma
visita e as duas sobem sem se sobrescrever.

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

## Escopo atual: self-contained, SEM marketplace (decisão)

**Decidido (2026-07-24): por enquanto, só o app de campo, standalone.** O produto
roda sozinho — Company, Contract, Site, Service + catálogos, Route/Shift, Crew,
ServiceOrder, Medição — usando **apenas a própria equipe/vendors da empresa de
manutenção**. Nada de `ServiceRequest`, nada de pool de marketplace, nada de
`ProviderProfile` compartilhado.

Isso **simplifica** a arquitetura em vez de complicar: sem acoplamento ao B2C, o
módulo de campo é um contexto fechado que pode até virar app/serviço próprio. A
origem da prestadora é só interna (crew montada no turno + vendors da empresa).

### Flywheel híbrido — adiado, não morto

O plano anterior era **híbrido**: cair para o marketplace quando faltasse cobertura
de um serviço obrigatório, com o **mesmo `ProviderProfile` servindo os dois lados**
(vendor "de dentro do contrato" vs. "de fora"). Isso continua sendo o argumento
mais forte de longo prazo — contratos criam demanda recorrente que semeia a oferta;
a oferta faz backstop dos contratos. **Mas fica para depois.** O MVP não integra o
marketplace; a decisão de reconectar os dois é uma escolha futura, com o mesmo gate
de validação. Guardar os `rates` dos dois lados desde o dia 1 mantém essa porta
aberta sem custo.

## Três opções de arquitetura

### A — camada fina sobre `ServiceRequest` · **descartada**

`Organization` + `Contract` + `ServiceRequest.contract_id`. Parece a mais barata
(era o que `estrategia-b2b.md` sugeria). Mas o marketplace tem `budget_max` único
e proposta/leilão; **não tem** catálogo de service/equipment/consumable por
empresa, nem cobrança por visita/hora. O modelo de cobrança não cabe aqui.

### B — módulo B2B isolado · **recomendada**

Contexto **self-contained**, espelhando o Yeti enxugado: `Organization`,
`Contract`, `Site`, `Service` + catálogos (`Equipment`, `Consumable`, `Form`),
`Shift`, `Route`, `Crew`, `ServiceOrder`, `Medição`. **Não toca no marketplace** —
nem `ServiceRequest`, nem `ProviderProfile`. Com o escopo standalone (ver "Escopo
atual"), o isolamento fica ainda mais limpo: pode viver no mesmo backend por
conveniência, ou ser serviço próprio, sem acoplamento.

É a única que respeita o modelo de cobrança. A porta do híbrido fica aberta pelos
`rates` guardados desde o dia 1, mas nada é compartilhado agora.

### C — portar a prova (form) primeiro · **descartada**

Extrair o motor de inspeção como primeira peça. Errado: o form é folha do
service, não a espinha. Liderar por ele é telhado antes da parede.

## O que NÃO trazer do Yeti

Sobrou quase nada. **Turno, rota, crew e geofencing ficam** (eu errei ao excluir
os quatro, um a um). O que fica de fora é só: **whitelabel** e **ChargeOver**
(billing terceirizado) — plugáveis depois, nenhum é espinha. E, por decisão de
escopo, a **integração com o marketplace** (ver "Escopo atual"). Não é mais
"trazer o mínimo do Yeti" — é "trazer o Yeti de campo quase inteiro, standalone".

## Superfície de app

Com o pivot (este vira o produto principal), são **três atores**:

- **Gestor da empresa de manutenção e síndico → painel web** (Filament, que já
  existe). Estão numa mesa; despacham rotas, aprovam medição, exportam PDF.
- **Operador de campo → o app do provider, em modo de campo.** **Não é um app
  novo** (decisão 2026-07-24): a experiência de campo é construída **sobre o app do
  provider existente** (`frontend/apps/provider`), **atrás de uma feature flag**.
  Inicia turno e rota, executa a `ServiceOrder` no site (foto+geo, lista de
  serviços, equipamento e material aninhados por serviço, form). **Cada membro da
  equipe tem o app no próprio celular.** Ver protótipo de campo.

### Feature flags (decisão)

Cada capacidade fica **atrás da sua própria feature flag**. **Por enquanto só a de
campo (`field_service`) está ativa** — as features de marketplace do provider ficam
desligadas. Isso operacionaliza o "self-contained, sem marketplace": não é um fork
nem um app separado, é o mesmo app do provider com um conjunto de flags que decide o
que aparece. Reconectar o marketplace um dia é ligar flags, não reescrever.

### Decisões do app do operador

- **Turno → rota → parada, da equipe.** Um membro é líder; o operador inicia o
  turno, escolhe a rota; cada parada é uma visita. Config e despacho **por rota**.
- **Iniciar o turno é montar o turno.** No começo o líder **seleciona a equipe**
  (quem entra hoje) e **os equipamentos cobráveis que vai levar** — um "manifesto"
  do turno. O conjunto de equipamento carregado **escopa o que pode ser cobrado**
  nas OSs do dia: só se cobra equipamento que a equipe efetivamente levou. Liga o
  catálogo `Equipment` (por visita/hora) ao turno.
- **Multi-dispositivo e colaborativo.** Vários membros editam a **mesma OS** ao
  mesmo tempo, cada um no seu celular; o líder pode **atribuir** serviços. Cada
  serviço guarda **o autor** (a hora do `por hora` é de quem fez). Exige sync
  **por item (autor + UUID)**, não last-write-wins na OS.
- **Offline-first, não-negociável.** Subsolo, garagem e casa de máquinas não têm
  sinal. A OS grava no aparelho e sincroniza sozinha quando o sinal volta — exige
  **IDs gerados no cliente (UUID)** e resolução de conflito no sync, no mesmo
  espírito dos jobs idempotentes já documentados.
- **Visibilidade do valor é config, não decisão do operador.** **Dois tipos:**
  mostra o total ao operador, ou não. O default esconde o dinheiro no aparelho de
  campo — `customer_rate`/`contractor_rate` e a medição vivem no painel. É um flag
  de empresa/contrato, "setado em outro lugar".
- **Navegação da rota.** Opção de **mapa** da rota; botão para **abrir no Waze /
  Google Maps** com a rota já montada (deep-link com os pontos). O app não
  reimplementa navegação — delega ao que o motorista já usa.
- **Geofencing (mecanismo central, não acessório).** Cada `Site` tem uma
  **geocerca** (centro + raio) que **confirma presença** e valida as fotos contra a
  cerca. É *outdoor* (GPS) — complementa o site map *indoor*. Muda o "geo
  confirmado" para "dentro da geocerca". **Start/end do site é manual** — a cerca
  **não** inicia nem encerra o cronômetro sozinha. O que ela faz é **lembrar**: se
  o operador está dentro da geocerca e **não iniciou** o site, o app avisa (nudge
  "você está no Cond. X e ainda não iniciou").
- **Foto do site e site map.** Cada `Site` tem uma **foto de referência**. Além
  disso, **site maps**: imagens do site (planta/área) com **fotos fixadas em
  pontos** por **coordenada relativa na planta (x,y%)**, não geo — dentro do prédio
  o GPS não pega. Distinto da foto antes/depois da visita, que é do trabalho.
- **Durações.** Mostrar a **duração do turno aberto** (timer correndo) e a
  **duração de cada site** (tempo por visita). Alimentam medição por tempo e
  produtividade.
- **Tarja de modo offline.** Sem internet, uma **faixa vermelha** persistente diz
  "Modo offline · sincroniza ao voltar a internet". O operador nunca fica em
  dúvida se o trabalho está salvo — está no aparelho, sobe sozinho depois.

## Gate

**Nada disso se constrói antes das 5 conversas diagnósticas** (ver
`estrategia-b2b.md`, seção "O que fazer antes de escrever código"). O critério:
**3 de 5 conversas dando um número de "quanto pagaria por mês"** → aí sim se
escolhe a opção (provavelmente B) e um plano de implementação à parte é escrito.

Construir o módulo B2B — ainda mais rico do que se imaginava — antes de saber que
alguém paga é o erro de publicar faixa de preço inventada, em escala de trimestre.
