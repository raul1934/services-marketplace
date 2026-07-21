# Walkthrough dinâmico no device — app Customer (Chama Fácil)

Device físico Samsung (1080×2408 @ density 450 ≈ 384×856dp), Android, dark mode. Backend Docker local com seed. Conduzido via adb (screencap + input). Logado como **Cliente Teste** (cliente@chamafacil.test). Evidências em `ux-audit/screens/NN-*.png`.

Persona principal do percurso: **"Aflito na estrada"** (carro quebrado, com pressa, quer guincho já).

---

## Percurso executado (caminho feliz ponta a ponta)
Home → atalho "Guincho" (Ajuda Rápida) → **wizard de criação de 7 etapas** → envio (slide) → detalhe do pedido ("Aberto", 0 propostas) → **propostas chegam em tempo real (4→5)** → aceitar melhor proposta (slide) → **rastreio ao vivo** (mapa, ETA, código de início). Também percorri: drawer, aba Chamados (lista), aba Perfil, Avisos (notificações), abas internas do pedido (Acompanhamento/Solicitação/Histórico).

**Contagem de toques até enviar o pedido (persona aflita):** atalho(1) → focar descrição(2) → digitar → Continuar→etapa2(3) → Usar localização(4) → Continuar→3(5) → Continuar→4(6) → Continuar→5(7) → Continuar→6(8) → Continuar→7(9) → arrastar para enviar(10). **~10 interações + 7 telas** para um chamado urgente. Muito alto para emergência.

---

## Achados dinâmicos (o que a leitura de código não pega)

### BUGS confirmados em runtime
1. **[ALTO] Moeda quebrada no card de proposta**: preço da proposta renderiza `R$ 103.2` / `R$ 115.2` (ponto decimal en-US, sem centavos), enquanto a aba Solicitação e as notificações mostram `R$ 120,00` / `R$ 103,20` corretos. Bug localizado no componente de preço da proposta (formatter errado). Evidência: `15-cancel-confirm.png`, `16-proposal-scroll.png` vs `14-req-solicitacao.png`, `23-notifications.png`.
2. **[ALTO] i18n misturado nas notificações**: títulos "**New question from a pro**" (inglês, string do app) convivem com "Nova proposta recebida" e "Atualização do atendimento" (pt). String hardcoded não traduzida. Ev.: `23-notifications.png`.
3. **[MÉDIO] ETA inconsistente entre superfícies**: card de proposta mostra `1h4` (truncado, sem "min", para 64 min); notificações mostram `64 min`; rastreio mostra `~16 min`. Três formatos para tempo de chegada. Ev.: `16`, `23`, `17`.
4. **[MÉDIO] Perguntas do QnA em inglês** num app pt-BR ("Is the transmission automatic or manual?", "What's the make and model of the vehicle?"). Mesmo sendo seed, o padrão de o prestador perguntar dados que **o app já tem** (marca/modelo do veículo estão no ativo "Test · AJP · PR3 125 Enduro") mostra que os dados do ativo não são repassados ao prestador. Ev.: `15`, `16`.
5. **[MÉDIO] "Continuar" desabilitado silenciosamente**: na etapa 1, com descrição vazia, tocar "Continuar" não faz nada e não mostra mensagem do que falta; o botão só fica opaco. Usuário em pânico toca e "não acontece nada". Ev.: `02-step1-continue-empty.png`.
6. **[MÉDIO] Teclado cobre o campo de descrição**: o textarea "O que aconteceu?" fica no rodapé; ao focar, o teclado sobe e **encobre o campo** — não dá para ver o que se digita (keyboard-avoidance insuficiente). Ev.: `03`, `04`.
7. **[MÉDIO] Endereço muda entre etapas**: etapa 2 mostrou "5, Jardim Marajó"; a Revisão (etapa 7) e o detalhe mostram "Rua Patrícia Rodrigues Fontes, 805, Jardim Marajó" — geocodificação reversa inconsistente entre telas. Ev.: `07` vs `12`/`14`.

### FALSO POSITIVO descartado
- O card "Precisa de ajuda agora?" **NÃO** está com clipping/overflow — parecia cortado no 1º screenshot só por estar abaixo da dobra; rolando, renderiza inteiro (`22-home-scrolled.png`). Fica registrado como problema de **hierarquia** (CTA primário no fim da rolagem), não de layout.

### Inconsistências de UI/interação
8. **[ALTO] Dois mecanismos para a MESMA ação de aceitar proposta na MESMA tela**: a 1ª proposta ("Melhor opção") usa **"Arraste para aceitar" (SlideToConfirm)**; as demais usam **botão "Aceitar proposta" (tap)**. Mesma ação, dois controles. Ev.: `16-proposal-scroll.png`.
9. **[MÉDIO] Status todos verdes na lista**: "Aceito", "Em atendimento" e "Concluído" usam o mesmo verde — não dá para diferenciar ativo de concluído num relance. Ev.: `20-requests-list.png`.
10. **[MÉDIO] Provider novo aparece como "0.0 · 0 serviços" com 5 estrelas vazias** — parece nota zero (negativo), quando deveria ser "Novo"/"Sem avaliações". Ev.: `16`.
11. **[BAIXO] Pluralização preguiçosa**: "5 proposta(s)", "0 foto(s)", "1 proposta(s)" — o "(s)" literal aparece na UI. Ev.: `20`, `12`.

### Arquitetura de informação / fluxo (ser o usuário)
12. **[CRÍTICO] 7 etapas para um chamado urgente**: `ETAPA 1/7` a `7/7`. Para a persona aflita, é fricção excessiva (Doherty/Hick). Etapas fracas: **etapa 5 é uma tela inteira só para "Adicionar foto" opcional** (muito espaço vazio); campos das etapas 3/4 são todos opcionais (Continuar já habilitado). Dava para colapsar em 2–3 telas + um "modo expresso". Ev.: `01`,`06`,`08`,`09`,`10`,`11`,`12`.
13. **[ALTO] Campo fora de contexto**: etapa 2 mostra **"ACESSO: Adulto com chave / Código de acesso"** para um **guincho na estrada** — é campo de serviço doméstico. O wizard mistura campos genéricos (não adaptados) com campos dinâmicos adaptados (etapa 3, específicos de guincho). Ev.: `06` vs `08`.
14. **[ALTO] Copy promete UI que não existe (no 1º momento)**: etapa 2 diz "Ajuste o pino se precisar", mas **não há mapa/pino** até tocar "Usar minha localização"; só então o Leaflet carrega. Ev.: `06` vs `07`.
15. **[CRÍTICO] Navegação redundante em 3 superfícies**: o **drawer** (`19-drawer.png`) é quase todo redundante — "Meu perfil" = aba Perfil; "Meus pedidos" = aba Chamados; "Meus ativos" = cards da Home; "Pedir serviço" = a ação primária. Três caminhos para os mesmos destinos, e a **ação de maior valor ("Pedir serviço") fica escondida dentro do hambúrguer**. Não há FAB/aba dedicada de "Pedir".
16. **[ALTO] Hierarquia da Home**: ordem = saudação → **Meus ativos** (patrimônio) no topo → Chamado em andamento → Ajuda Rápida → CTA "Precisa de ajuda agora?" no fim. A coisa mais importante (pedir ajuda) está por último; patrimônio (baixa frequência) está primeiro. Ev.: `00b`, `22`.
17. **[MÉDIO] Perfil é um beco sem saída**: não edita nome/e-mail/telefone/foto, sem formas de pagamento, sem endereços, sem preferências de notificação e **sem excluir conta** (risco de rejeição nas lojas). Só tema + idioma + Sair. O card de identidade parece tocável mas não é. Ev.: `21-profile.png`.
18. **[MÉDIO] Spam de notificações / badge 99+**: cada proposta e cada pergunta geram um aviso separado, sem agrupamento por pedido. 1 pedido com 5 propostas ~ 10 avisos. Badge "99+" perpétuo vira ruído. Ev.: `23`, `00b`.

### Momentos que faltam (Peak-End)
19. **[MÉDIO] Sem momento de sucesso ao enviar o pedido**: após arrastar para enviar, cai direto no detalhe "Aberto" sem celebração/confirmação — o pico de esforço não é recompensado. Ev.: `12`→`13`.
20. **[ALTO] Aceitar proposta é um compromisso financeiro sem resumo/confirmação explícita**: o slide aceita e transiciona direto ao rastreio; não há "você vai contratar Provider 04 por R$103,20 — confirmar?" nem feedback de sucesso. Ev.: `16`→`17`.
21. **[MÉDIO] "Cancelar chamado" (destrutivo) é link cinza de baixo contraste**; ordenação Preço/Tempo/Nota aparece mesmo com 0 propostas. Ev.: `13`.

### Pontos POSITIVOS (Peak-End / manter)
- Auto-seleção do único ativo com microcopy clara ("Selecionamos este por ser o seu único cadastrado").
- Ditado por voz no campo de descrição.
- Etapa 6 (Orçamento): medidor com valor sugerido + "Guincho custa em média R$120 nesta região" = boa transparência/ancoragem de preço (CRO). Ressalva: semântica das cores do medidor (vermelho→verde) pode confundir.
- Etapa 7 (Revisão): resumo com edição in-place por linha (lápis) = ótimo padrão.
- Rastreio ao vivo: stepper Aceito→A caminho→Chegou→Concluído, mapa "Ao vivo", ETA, **código de início (7157)** = padrão de segurança sólido; gating de remarcar/ausência por deadline ("liberam às 20:18").
- Realtime de fato funciona (propostas entram sozinhas, chime).

---

## Cobertura por leitura de código (não renderizado no device nesta sessão)
Coberto pelos 4 relatórios de cluster estático (auth/profile, home/create/assets, request-lifecycle, design-system/global): telas de exceção (dispute/warranty/requote/surcharge/reschedule/no-show), receipt, rate, categories, assets (new/edit/setup), AR medição, welcome/login/register/verify. Telas só-nativas (AR/Viro, push real) ficam por código.
