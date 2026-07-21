# Auditoria UX/UI/Acessibilidade — Cluster **Autenticação + Onboarding + Perfil/Config**
App: **Chama Fácil (Customer)** · React Native + Expo Router · Auditor: Staff UX/UI/A11y (WCAG 2.2)
Data: 2026-07-20 · Idioma: pt-BR

> Postura da auditoria: **cética por padrão**. Cada tela é questionada quanto à sua própria razão de existir, não só quanto ao polimento. Nenhum fluxo recebe o benefício da dúvida.

## Sumário executivo (achados mais graves)

| # | Severidade | Achado | Evidência |
|---|-----------|--------|-----------|
| 1 | **Crítico** | Toggle **DEV/PROD** exposto a usuários finais nas telas pré-login (welcome + login) num app em produção. Qualquer pessoa pode apontar o app para o backend de dev. | `EnvSwitch.tsx`; `welcome.tsx:159`; `login.tsx:54` |
| 2 | **Crítico** | **Não existe "Esqueci minha senha"** em lugar nenhum. Quem loga por e-mail/senha e esquece a senha fica sem saída. | `login.tsx` (ausência) |
| 3 | **Crítico** | Vazamento de infra: o erro de login imprime **`API: <host do backend>`** para o usuário final. | `login.tsx:83` |
| 4 | **Crítico** | Campos são **placeholder-como-label** (sem label persistente) e o placeholder usa `ink3` (~2.6:1) — falha WCAG 1.4.3 e 3.3.2. Ao digitar, o rótulo some. | `AuthField.tsx:35`; `Text.tsx:25` (comentário admite ink3 reprova AA) |
| 5 | **Crítico** | **Sem autofill/gerenciador de senha**: nenhum campo passa `autoComplete`/`textContentType` (e-mail, senha, nome, telefone, OTP parcial). Fricção enorme no cadastro/login. | `login.tsx:75-76`; `register.tsx:47-50` |
| 6 | **Alto** | **Logout sem confirmação** — 1 toque destrói a sessão. | `profile.tsx:71` |
| 7 | **Alto** | Perfil **não permite editar nada** (nome, e-mail, telefone, foto, senha) nem excluir conta (exigência de loja de apps). | `profile.tsx` (ausência) |
| 8 | **Alto** | Links de ação (Entrar/Criar conta/Reenviar) usam `accent` (#ff6a3d) sobre branco (~2.9:1) e são `<Text onPress>` sem `accessibilityRole="button"`. Falha contraste + semântica. | `welcome.tsx:189`; `login.tsx:96`; `register.tsx:62`; `verify.tsx:78` |

---

## Fluxograma do fluxo de auth (Mermaid)

```mermaid
flowchart TD
    A([App abre]) --> B{Gate: status?}
    B -- loading --> S[SplashBrand]
    B -- guest --> G{segmento é '(auth)'\nou exempt medicao/ar?}
    G -- não --> W[/redirect /(auth)/welcome/]
    G -- sim --> AUTHZONE
    B -- authed --> H{está em '(auth)'?}
    H -- sim --> HOME[/redirect /(tabs)/home/]
    H -- não --> APP[App autenticado]

    subgraph AUTHZONE[Zona (auth)]
      W --> WEL[welcome\n3 slides]
      WEL -- 'Pular' --> REG
      WEL -- 'Começar' --> REG[register]
      WEL -- 'Entrar' --> LOG[login]
      LOG -- tab Telefone --> OTP1[requestOtp -> verify]
      LOG -- tab E-mail --> LEP[login email+senha]
      LOG -- 'Criar conta' --> REG
      LOG -- Google --> SOC[social google]
      REG -- 'Entrar' --> LOG
      REG -- Google --> SOC
      OTP1 --> VER[verify\nOTP 6 dígitos]
      VER -- código ok --> ADOPT
      LEP --> ADOPT
      SOC --> ADOPT
      REG -- submit --> ADOPT
    end

    ADOPT[[token adotado -> status=authed]] --> HOME
    HOME --> APP

    %% Buracos
    LOG -. FALTA .-> FP[[Esqueci a senha?\nNÃO EXISTE]]
    REG -. FALTA .-> EV[[Verificação de e-mail\nNÃO EXISTE]]
    APP -. 401 em qualquer request .-> KICK[[onUnauthorized:\nlogout silencioso -> welcome]]
    KICK --> W
```

**Observações do Gate** (`app/_layout.tsx:30-93`):
- `status === 'loading'` mostra `SplashBrand` — ok.
- Redirect guest→welcome e authed→home é feito em `useEffect` (`_layout.tsx:76-82`), i.e. renderiza a tela "errada" por 1 frame antes de redirecionar. Aceitável, mas há flash possível.
- `exempt = medicao | ar-medicao` (`_layout.tsx:79`): telas de POC acessíveis **sem auth**. Débito conhecido, mas é superfície de risco que não deveria ir para produção.
- **401 = logout global** (`client.ts:165` → `AuthProvider.tsx:50-54`): qualquer 401 transitório derruba a sessão e joga para welcome, **sem refresh token e sem aviso**. Doherty/consistência: o usuário "é deslogado do nada".

---

## 1) welcome.tsx — Onboarding (3 slides)

### Objetivo
Apresentar a proposta de valor em 3 cenas ilustradas e empurrar para cadastro/login.

### Arquitetura de informação
- Hero com gradiente + cena ilustrada (SceneHelp/Bids/Track), card branco sobreposto com: dots de paginação, eyebrow, título, corpo, linha "Pular + Próximo/Começar", e "Já tem conta? Entrar".
- **Redundância de saídas**: existem **três** caminhos que levam ao mesmo `register` — "Pular" (`:179`), "Começar/Próximo→último" (`:184`) e a string `welcome.createAccount` (definida no i18n mas **nunca usada**, `pt-BR.json:98`). "Pular" um onboarding levar para **cadastro** é semanticamente errado (Jakob: "pular" = ir para o conteúdo, não para um formulário).
- **Bug de área tocável invisível**: no último slide, `last ? '' : skip` renderiza um `<Text>` **vazio mas ainda com `onPress` e `flex:1`** (`:179-181`) → metade da largura vira um alvo invisível que navega para register. Confuso e clicável por engano.
- **Crash potencial**: `slides[i].title` (`:176`) é acessado sem guarda. Se a tradução `welcome.slides` vier parcial/quebrada, quebra a tela. Compare com `FirstAssetTutorial.tsx:27-35`, que **filtra chaves faltando** de propósito — a welcome não tem essa proteção.
- Sem "voltar" entre slides (só avança). Sem swipe gesture (só botão) — as cenas parecem cards arrastáveis mas não são.

### Heurísticas / Leis
- **Nielsen #4 (Consistência)**: "Pular"→register contradiz o significado universal de pular onboarding.
- **Nielsen #2 (Correspondência com o mundo real)**: cena com "R$ 120", "Melhor opção", "João S. 4.7" é decorativa, mas parece dado real.
- **Hick**: rodapé com 3 CTAs concorrentes (Pular / Começar / Entrar) dilui a decisão.
- **Fitts**: link "Entrar" (`:189`) é texto inline pequeno (13.5px), sem `hitSlop`.

### UI
- Números mágicos por toda parte: `fontSize` 11.5/25/14.5/13.5, `marginTop:-28`, `padding:26`, `paddingBottom: 34 + insets.bottom`, dots 22×7/7×7 (`:169-177`). Nada vem de tokens do tema.
- Dots de paginação: altura 7px, puramente decorativos.
- Estados: sem loading/erro (tela estática) — ok.

### Acessibilidade (WCAG 2.2)
- **Cenas ilustradas não são ocultadas do leitor de tela** (`SceneHelp/Bids/Track`) → o VoiceOver/TalkBack lê "Do que você precisa?", "R$ 95", "Melhor opção" fora de contexto. Falta `accessibilityElementsHidden`/`importantForAccessibility="no-hide-descendants"` ou um `accessibilityLabel` único para a ilustração. **(1.1.1, 1.3.1)**
- Dots sem `accessibilityRole`/estado (não informam "slide 1 de 3"). **(1.3.1)**
- "Pular"/"Entrar" são `<Text onPress>` sem `accessibilityRole="button"` → não anunciados como botões, não recebem foco previsível. **(4.1.2)**
- Link "Entrar" com cor `accent` sobre `surface` (~2.9:1) reprova **1.4.3**.
- Alvo "Pular"/"Entrar": altura efetiva ~18px, **< 24×24 CSS px** exigido por **2.5.8 (Target Size Minimum)**.

### Design System
- Reimplementa todo o "chrome" à mão (não usa `<Screen>`) — o próprio comentário (`:166-168`) admite ter que recalcular insets manualmente. Fonte de bug de safe-area.
- `TMini`, `CatIc`, `TutFloat`, `BidMini` são componentes locais que duplicam padrões de card/pílula que já existem no DS (`Card`, `Row`, `CatIc` em `primitives.tsx:178`). Divergência.

### VEREDITO: **Ajustar (perto de redesenhar o rodapé)**
- Remover EnvSwitch daqui (ver #1).
- "Pular" deve **ir para home/estado guest** ou sumir; não para register.
- Ocultar cenas do leitor de tela; dar 1 label à ilustração.
- Trocar `<Text onPress>` por `Button`/`Pressable` com role e alvo ≥44dp.
- Consolidar CTAs: 1 primário ("Criar conta") + 1 secundário ("Entrar").

```
Redesenho do rodapé (mock ASCII):
┌───────────────────────────────────┐
│  ●━━  ○   ○     (slide 1 de 3)     │
│  01 · PEÇA AJUDA                   │
│  Ajuda a um toque de distância    │
│  Estrada, casa ou pets — peça …   │
│                                   │
│  [   Criar conta            → ]   │  ← Button grad, full, ≥50dp
│        Já tem conta?  Entrar      │  ← Pressable role=button, ≥44dp
└───────────────────────────────────┘
   (sem "Pular"; avançar por swipe + botão "Próximo" nos slides 1-2)
```

---

## 2) login.tsx

### Objetivo
Autenticar cliente por **telefone (OTP)** ou **e-mail/senha**, ou Google.

### Arquitetura de informação
- Segmented control Telefone/E-mail (`:62-69`). Default = **email em dev, phone em prod** (`:17`) → o dev testa um caminho e o usuário vê outro. Risco de divergência não percebida.
- Telefone: prefixo fixo `+55` e `'55' + digits` hardcoded (`:31,72`). **Sem máscara** e sem validação de formato; aceita qualquer coisa. `keyboardType="phone-pad"` ok, mas **sem `autoComplete="tel"`/`textContentType="telephoneNumber"`**.
- E-mail/senha: `autoCapitalize="none"` e `keyboardType="email-address"` ok. **Faltam `autoComplete="email"`+`textContentType="emailAddress"` e `autoComplete="current-password"`+`textContentType="password"`** → gerenciadores de senha não preenchem. (#5)
- **Sem "Esqueci a senha"** (#2) — bloqueio total para quem usa senha.
- **Sem toggle de mostrar/ocultar senha** — `secureTextEntry` puro.
- **Sem autofocus** no primeiro campo → 1 toque a mais sempre.
- `formError` mostra a mensagem **+ `API: currentHost()`** (`:82-83`) — vazamento de host de produção ao usuário (#3).
- `Screen scroll={false}` (`:51`) + espaçador `flex:1` (`:93`) e **sem `KeyboardAvoidingView`** → em telas pequenas o teclado pode cobrir botão/Google e não há rolagem.

### Heurísticas / Leis
- **Nielsen #9 (Ajuda a recuperar de erros)**: sem recuperação de senha; erro genérico + host técnico.
- **Nielsen #5 (Prevenção de erro)**: telefone sem máscara/validação client-side.
- **Jakob**: dividir método de login em tabs é menos convencional que "continuar" progressivo; mas aceitável.
- **Doherty**: OTP só dá feedback após `requestOtp` resolver; sem skeleton no botão além de `loading` (isso está ok via `Button loading`).

### UI / A11y
- Link "Criar conta" (`:96`): `accent` s/ branco (~2.9:1) — reprova 1.4.3; `<Text onPress>` sem role — reprova 4.1.2; alvo pequeno — reprova 2.5.8.
- `AuthField` sem label persistente e placeholder `ink3` (herda #4).
- Erro de campo (`errors.email`) é `<Text>` visual, **não anunciado** por leitor de tela (sem `accessibilityLiveRegion`/`accessibilityLabel` no input). **(3.3.1/4.1.3)**
- GoogleButton: `Pressable` sem `accessibilityRole="button"` e sem `accessibilityState={{disabled}}` no loading (`GoogleButton.tsx:11-15`).

### Design System
- Usa DS corretamente (Screen, AuthField, Button, Segment, DividerOr, GoogleButton) — bom. Exceção: EnvSwitch (não deveria estar aqui) e o link inline manual.

### VEREDITO: **Ajustar (com 1 item Crítico de fluxo: adicionar recuperação de senha)**
- Adicionar "Esqueci a senha" abaixo do campo senha.
- Remover a linha `API: ...`.
- Adicionar autofill em todos os campos, máscara de telefone, toggle de senha, `KeyboardAvoidingView`.
- Igualar o `mode` default entre dev e prod (ou ao menos documentar).

```
┌───────────────────────────────┐
│ Chama Fácil                   │   (sem EnvSwitch)
│ Bem-vindo de volta            │
│ [ Telefone | E-mail ]         │
│ ✉  voce@email.com             │  ← autoComplete=email
│ 🔑 ••••••••            👁      │  ← toggle mostrar senha
│                Esqueci a senha│  ← NOVO, role=button
│ [  Continuar             →  ] │
│ ───────── ou ─────────        │
│ [ G  Continuar com Google  ]  │
│        Novo aqui? Criar conta │
└───────────────────────────────┘
```

---

## 3) register.tsx

### Objetivo
Criar conta cliente (nome, e-mail, telefone opcional, senha) ou via Google.

### Arquitetura de informação
- Ordem dos campos ok (nome→e-mail→telefone→senha).
- **Telefone é "opcional" só no i18n (`register.phone`), mas esse label NUNCA é renderizado** — `AuthField` só mostra ícone + placeholder (`:49`). O usuário não sabe que é opcional. **Todas** as chaves `register.name/email/phone/password` (labels) estão mortas.
- Senha: mínimo **6 caracteres** (placeholder `:50`, i18n `pt-BR.json:139`) — política fraca; sem medidor de força; **sem confirmar senha**; **sem toggle mostrar**.
- **Legal**: "concorda com os Termos e a Política de Privacidade" (`:60`) é **texto puro, não clicável** — não há como abrir/ler os termos. Problema legal + WCAG (link ausente).
- **Sem autofill**: nenhum `autoComplete`/`textContentType` (`name`, `email`, `new-password`) — herda #5.
- **Sem verificação de e-mail**: `register()` já autentica direto (`AuthProvider.tsx:70-80`). Contas com e-mail não verificado.
- Divergência de login: quem se cadastra **só com e-mail** (telefone omitido) **não consegue** usar o login por telefone (OTP). O par register/login não é simétrico e nada avisa.

### Heurísticas / Leis
- **Nielsen #1 (Visibilidade de estado)**: campos obrigatórios não sinalizados; "opcional" invisível.
- **Nielsen #10 (Ajuda/doc)**: termos não acessíveis.
- **Hick**: 4 campos + Google + 2 links; ok.
- **Postponed Registration / esforço**: exige nome+e-mail+senha antes de qualquer valor entregue. Vale questionar se não deveria ser **OTP-first** (telefone) como caminho primário, já que o app já tem OTP.

### UI / A11y
- Mesmos problemas de `AuthField` (label ausente, placeholder de baixo contraste, erro não anunciado).
- Legal 11px `ink3` (`:60`) — texto minúsculo e de baixo contraste (**1.4.3** e legibilidade).
- Link "Entrar" (`:62`): contraste `accent`, sem role, alvo pequeno.
- Sem autofocus.

### Design System
- Usa DS bem, exceto links inline e labels ocultos.

### VEREDITO: **Redesenhar (leve)** — a tela funciona mas tem lacunas legais/de conversão sérias.
- Tornar Termos/Privacidade **links reais**.
- Mostrar rótulos persistentes (label acima do campo) e marcar "opcional" no telefone visível.
- Autofill `new-password`, toggle mostrar, política de senha explícita (≥8, com feedback).
- Decidir e comunicar a simetria register↔login (se telefone é a chave do OTP, ou torná-lo obrigatório, ou permitir OTP por e-mail).

```
┌───────────────────────────────┐
│ Criar conta                   │
│ Nome                          │
│ 👤 Seu nome                   │
│ E-mail                        │
│ ✉  voce@email.com             │
│ Telefone (opcional)           │  ← label VISÍVEL
│ +55  (11) 99999-9999          │  ← máscara
│ Senha  (mín. 8)          👁   │
│ 🔑 ••••••••                   │
│ [  Criar conta           →  ] │
│ Ao continuar, você aceita os  │
│ [Termos] e a [Política]       │  ← LINKS reais, role=link
│        Já tem conta? Entrar   │
└───────────────────────────────┘
```

---

## 4) verify.tsx — OTP

### Objetivo
Confirmar o código de 6 dígitos enviado por SMS e autenticar.

### Arquitetura de informação
- Header BackBar, título/subtítulo com telefone "bonito" (`:57` formata ingênuo: `+55 ` + slice), OTP 6 boxes, erro, botão, timer de reenvio (24s), "Número errado? Editar".
- Auto-submete ao atingir 6 dígitos (`:42`) — bom (Doherty).
- Prefill do `debug_code` (`:16,51`) — comportamento de dev; garantir que `debug_code` **nunca** venha em produção (risco se vazar).
- **Reenvio sem feedback**: `resend()` (`:45-55`) só reseta `seconds`; nenhum toast "código reenviado". O usuário não sabe se funcionou.
- Timer `24` é número mágico arbitrário (`:19`).
- "Editar" faz `router.back()` (`:84`) — volta ao login; ok.

### Heurísticas / Leis
- **Nielsen #1**: reenvio sem confirmação visível.
- **Doherty**: bom no auto-submit; ruim na ausência de feedback de reenvio.

### UI / A11y
- `OtpInput` (`OtpInput.tsx`): input real é **escondido** (`opacity:0, 1×1px`) e a linha é um `Pressable` que foca. Problemas:
  - **Sem `accessibilityLabel`** no `TextInput` (ex.: "Código de verificação, 6 dígitos"). Leitor de tela encontra um Pressable sem nome + 6 Views de texto. **(1.3.1/4.1.2)**
  - As 6 caixas são `View`+`Text` lidas individualmente/fora de ordem.
  - `autoComplete="sms-otp"` + `textContentType="oneTimeCode"` presentes — **bom** (único campo com autofill correto no cluster).
  - Sem estado de **erro** nas caixas (borda continua accent); o erro é só um texto abaixo (`:70`).
  - Caixa 58px de altura — alvo ok.
- Erro (`:70`) não é `liveRegion` → não anunciado.

### Design System
- Usa DS (Screen, BackBar, OtpInput, Button, Text). Consistente.

### VEREDITO: **Ajustar**
- `accessibilityLabel` + `accessibilityLiveRegion="polite"` no input; borda de erro nas caixas.
- Toast/feedback ao reenviar; garantir `debug_code` só em dev.
- Considerar reenvio também por **ligação** após 2ª tentativa.

---

## 5) profile.tsx — Perfil/Config

### Objetivo
Mostrar identidade + acesso a ativos + preferências (tema/idioma) + logout.

### Arquitetura de informação — **esta tela é rasa demais para "Perfil/Config"**
Mostra: card de identidade (avatar, nome, e-mail/telefone), card "Meus ativos", card Aparência+Idioma, botão Sair.

**Faltando (lacunas graves de um Perfil real):**
- **Editar perfil** (nome, e-mail, telefone, foto, senha) — impossível. Não há tela de edição em lugar nenhum do cluster.
- **Excluir conta** — ausente. **Exigência de App Store/Play** para apps com login; a ausência é bloqueio de publicação.
- **Métodos de pagamento**, **endereços salvos**, **notificações/preferências**, **ajuda/suporte**, **Termos/Privacidade**, **versão do app**, **idioma do backend** — nada.
- Identidade sem ação: tocar no card de perfil não faz nada (não leva a editar).

### Heurísticas / Leis
- **Nielsen #3 (Controle do usuário)**: **logout em 1 toque, sem confirmação** (`:71`). Destrutivo (perde sessão/contexto). Deve confirmar.
- **Nielsen #7 (Flexibilidade)**: sem seleção de **paleta** (sunset/trust/night existem no tema, `themes.ts`, mas o perfil só troca light/dark/auto — o usuário nunca acessa trust/night).
- **Jakob**: usuários esperam "Editar perfil" e "Sair" separados; aqui só há Sair.

### UI / A11y
- Botões de tema e idioma são `size="sm"` → **altura 38dp** (`Button.tsx:37`), **< 44dp** exigido (2.5.8/2.5.5). Vários lado a lado.
- Botões de tema/idioma ativos não expõem `accessibilityState={{selected:true}}` (o `Button` só seta `disabled`), então o leitor não sabe qual está ativo. **(4.1.2)**
- Card "Meus ativos" tem `onPress` — verificar se `Card` seta role button (ícone `arrowR` sugere navegação); se não, falta semântica.
- `user?.email ?? user?.phone` (`:24`): se ambos nulos, linha vazia sem fallback.
- Trocar idioma (`:62-65`) chama `i18n.changeLanguage` + `persistLanguage`, mas **não** parece sincronizar `setApiLocale` aqui (o backend continuaria no locale antigo até o próximo boot, dependendo de listener externo). Verificar.

### Design System
- Usa DS (Screen, Card, Avatar, Button, Row, Icon). Consistente. O problema é escopo, não implementação.

### VEREDITO: **Redesenhar (expandir)** — hoje é uma tela de "configurações mínimas" fantasiada de "Perfil".
```
┌───────────────────────────────┐
│ Perfil                        │
│ ┌───────────────────────────┐ │
│ │ (av) Raul Neto        [✎] │ │ ← toca = Editar perfil
│ │      raul@email.com       │ │
│ └───────────────────────────┘ │
│ CONTA                         │
│ › Dados pessoais / senha      │
│ › Endereços                   │
│ › Formas de pagamento         │
│ › Meus ativos            (3)  │
│ PREFERÊNCIAS                  │
│ Tema  [Auto][Claro][Escuro]   │ ← ≥44dp, selected exposto
│ Idioma[ PT ][ EN ]            │
│ Notificações              ›   │
│ SOBRE / AJUDA                 │
│ › Central de ajuda            │
│ › Termos · Privacidade        │
│ › Versão 1.x.x                │
│ [        Sair             ]   │ ← confirma antes
│ Excluir minha conta           │ ← obrigatório p/ loja
└───────────────────────────────┘
```

---

## 6) EnvSwitch.tsx — **REMOVER de produção**

### Objetivo declarado
Alternar DEV↔PROD antes do login, repontando o cliente HTTP.

### Problema (Crítico)
- É montado em `welcome.tsx:159` e `login.tsx:54`, telas que **usuários finais reais veem** (o app está em produção em chamafacil.app). Um toque acidental repontaria o app para o backend de dev — dados/erros errados, "por que não recebo código?", suporte insano. **Sem gate `__DEV__`.**
- Deveria estar atrás de `if (!__DEV__) return null;` ou de um gesto oculto (7 toques no logo), nunca visível por padrão.

### A11y / UI
- `accessibilityLabel` presente (`:41`) — bom. `accessibilityRole="button"`.
- Alvo: `paddingVertical:5` + texto 11px → **~26px de altura**, **< 44dp** (2.5.8/2.5.5).
- Contraste em `onAccent`: texto `rgba(255,255,255,0.85)` sobre gradiente laranja — provavelmente ~2.5-3:1 no estado idle, limítrofe/reprova.

### VEREDITO: **Redesenhar/gate** — ocultar em produção; se mantido em dev, aumentar alvo para ≥44dp.

---

## 7) Componentes compartilhados de auth (`packages/shared/src/ui/auth`)

### AuthField.tsx — **Crítico (afeta login+register)**
- **Placeholder-como-label** (`:35`): sem label persistente (3.3.2) e placeholder em `ink3` (~2.6:1, o próprio `Text.tsx:25` admite que ink3 reprova AA) → 1.4.3.
- Não repassa `accessibilityLabel`; não vincula o `error` ao input (sem `accessibilityLiveRegion`/`aria-describedby`) → erros não anunciados (3.3.1/4.1.3).
- Não expõe API para toggle de senha nem para `autoComplete`/`textContentType` serem obrigatórios — os callers simplesmente omitem.
- Foco: `borderColor accent` + `boxShadow` (web) — visualmente ok; alvo (paddingV 14 → ~48px) ok.

### OtpInput.tsx
- Ver §4: falta `accessibilityLabel` no input escondido; caixas sem estado de erro. `autoComplete="sms-otp"` é o ponto positivo.

### GoogleButton.tsx
- `Pressable` **sem `accessibilityRole="button"`**; sem `accessibilityState={{disabled: loading}}` (`:11-15`). O label é filho (lido), mas semântica de botão falta. Padding 14 → ~48px, alvo ok.

### DividerOr.tsx
- Decorativo; o "ou" deveria ser `accessibilityElementsHidden` (ruído). Menor.

### BrandMark.tsx
- Logo SVG sem `accessibilityRole="image"`/label; wordmark é texto (ok). Menor.

### index.ts
- **Não exporta `AuthField`? Exporta.** (`BrandMark, AuthField, OtpInput, DividerOr, GoogleButton`). Ok — mas note que `AuthField` é o componente mais crítico e precisa de refactor de a11y central (corrigir aqui conserta as duas telas de uma vez).

---

## 8) Camada de auth (AuthProvider / client / useGoogleSignIn)

- **AuthProvider.tsx**: mensagens de erro em pt-BR e boas (`:62,86`). Porém **401 → logout global silencioso** (via `setUnauthorizedHandler`, `:50-54`) sem refresh token: sessão morre em qualquer 401 transitório. UX ruim (usuário "cai" para welcome sem explicação). Considerar refresh/soft-retry e um aviso.
- **client.ts**: `connectionErrorMessage()` localizada — bom. 401 dispara `onUnauthorized` mesmo para chamadas não-críticas (`:165`).
- **useGoogleSignIn.ts**: bem tratado (cancelamento, Play Services). Mas se `webClientId` não configurado ou web, retorna erro `auth.googleUnavailable` — e o **botão Google aparece mesmo quando indisponível** (welcome/login/register mostram sempre), levando o usuário a um beco. Idealmente esconder o botão quando `!configuredWebClientId`.

---

## Fluxos faltando (resposta direta ao briefing)

1. **Esqueci a senha / reset de senha** — **NÃO EXISTE**. Crítico. Sem e-mail de reset, sem tela, sem link. Quem loga por senha e esquece está preso.
2. **Verificação de e-mail** — **NÃO EXISTE**. `register()` autentica direto; contas ficam com e-mail não verificado.
3. **O cadastro pede**: nome (obrig.), e-mail (obrig.), telefone (opcional, mas não sinalizado como tal na UI), senha (mín. 6). Sem confirmar senha, sem termos clicáveis, sem verificação.
4. **OTP**: só no **login por telefone**. `requestOtp('55'+phone)` → `verify` com 6 dígitos, auto-submit ao completar, reenvio após 24s (sem feedback), prefill de `debug_code` em dev. Não há OTP por e-mail. **Assimetria**: cadastro só-e-mail não consegue login por OTP.
5. **Google**: nativo (`@react-native-google-signin`), troca access token → `social('google', token)` → adota token do role `client`. Botão sempre visível mesmo quando não configurado (leva a erro).
6. **Editar perfil / trocar senha / excluir conta** — **NÃO EXISTEM**. Excluir conta é exigência de loja.
7. **Biometria / lembrar dispositivo / login persistente com refresh** — ausentes; sessão depende de token único e cai no 1º 401.
8. **Termos e Política** como páginas/links reais — ausentes (só texto).

---

## Tabela consolidada por severidade

| Sev | Item | Arquivo:linha |
|-----|------|---------------|
| Crítico | EnvSwitch DEV/PROD visível em produção | `EnvSwitch.tsx`; `welcome.tsx:159`; `login.tsx:54` |
| Crítico | Sem recuperação de senha | `login.tsx` (ausência) |
| Crítico | Vaza host do backend no erro | `login.tsx:82-83` |
| Crítico | Placeholder-como-label + contraste ink3 | `AuthField.tsx:35`; `Text.tsx:25` |
| Crítico | Sem autofill/textContentType (email, senha, nome, tel) | `login.tsx:75-76`; `register.tsx:47-50` |
| Alto | Logout sem confirmação | `profile.tsx:71` |
| Alto | Perfil sem editar/excluir conta | `profile.tsx` (ausência) |
| Alto | Links de ação: contraste accent + sem role button + alvo <24px | `welcome.tsx:189`; `login.tsx:96`; `register.tsx:62`; `verify.tsx:78,84` |
| Alto | Termos/Privacidade não clicáveis | `register.tsx:60` |
| Alto | 401 = logout global silencioso, sem refresh | `client.ts:165`; `AuthProvider.tsx:50-54` |
| Alto | Cenas de onboarding não ocultas do leitor de tela | `welcome.tsx:52-132` |
| Alto | Botões sm de tema/idioma < 44dp + sem estado selected | `profile.tsx:44-67`; `Button.tsx:37` |
| Médio | "Pular" vai para register + `<Text>` vazio clicável | `welcome.tsx:179-184` |
| Médio | OtpInput sem accessibilityLabel/estado de erro | `OtpInput.tsx:47-57` |
| Médio | GoogleButton sem role/estado; botão aparece mesmo indisponível | `GoogleButton.tsx:11-15`; `useGoogleSignIn.ts:50-52` |
| Médio | Erros de campo não anunciados (sem liveRegion) | `AuthField.tsx:42`; `login/register/verify` |
| Médio | Telefone sem máscara/validação; '55' hardcoded | `login.tsx:31,72`; `register.tsx:49` |
| Médio | Sem toggle mostrar senha; senha mín. 6 fraca | `login.tsx:76`; `register.tsx:50` |
| Médio | Reenvio de OTP sem feedback | `verify.tsx:45-55` |
| Médio | `slides[i]` sem guarda (crash se i18n parcial) | `welcome.tsx:176` |
| Médio | Sem KeyboardAvoidingView (login scroll=false) | `login.tsx:51,93` |
| Médio | Assimetria register(só-email) ↔ login OTP | `register.tsx:24`; `login.tsx:30-33` |
| Baixo | Números mágicos (fontSize/spacing) fora de tokens | `welcome.tsx`, `login.tsx`, `register.tsx` (pervasivo) |
| Baixo | i18n com chaves mortas (labels de campo, createAccount) | `pt-BR.json:98,107,109,132-139` |
| Baixo | Default de `mode` diverge dev/prod | `login.tsx:17` |
| Baixo | DividerOr/BrandMark sem tratamento de a11y decorativo | `DividerOr.tsx`; `BrandMark.tsx` |
| Baixo | Mode do perfil não expõe paletas trust/night | `profile.tsx:44`; `themes.ts` |

---

## Recomendações priorizadas (ordem de ataque)
1. **Gate do EnvSwitch em `__DEV__`** + remover `API: host` do erro de login. (2 linhas, elimina 2 Críticos.)
2. **Refactor central do `AuthField`**: label persistente, `accessibilityLabel`, `accessibilityLiveRegion` no erro, props obrigatórias de `autoComplete`/`textContentType`, e toggle de senha. Conserta login+register de uma vez (3 Críticos/Altos).
3. **Adicionar fluxo "Esqueci a senha"** (link + tela + endpoint).
4. **Perfil**: confirmação no logout, tela de editar perfil/senha, **excluir conta**, links de Termos.
5. Trocar todos os `<Text onPress>` de navegação por `Button`/`Pressable role=button` com alvo ≥44dp e cor com contraste ≥4.5:1 (usar `ink` sublinhado + accent só como realce, ou escurecer o accent para links).
6. Corrigir "Pular"→register e o `<Text>` vazio clicável na welcome; ocultar cenas do leitor de tela.
```
