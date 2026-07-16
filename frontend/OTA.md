# OTA (expo-updates) + distribuição por APK — Chama Fácil

Duas camadas de atualização, complementares:

1. **OTA de JS (expo-updates + EAS Update)** — empurra mudanças de **JS/assets** na
   hora, sem gerar/instalar APK novo. Cobre a maioria das mudanças.
2. **Atualização nativa (banner in-app + version.json)** — quando muda código
   **nativo** (ex.: ViroReact), OTA não resolve; o app lê `chamafacil.app/version.json`,
   compara com a versão instalada e mostra "Atualização disponível" com link do APK.
   Ver `packages/shared/src/lib/appUpdate.ts` + `ui/UpdateBanner.tsx`.

## O que já está configurado (código)

- `expo-updates@~0.27.5` instalado nos dois apps.
- `app.json` (customer e provider): bloco `updates` + `runtimeVersion: { policy: "appVersion" }`.
  - `appVersion` = OTA só se aplica a builds com a **mesma** `version`. Ao mudar código
    nativo, **suba a `version`** (1.0.0 → 1.1.0) e gere APK novo; mudanças só de JS
    mantêm a versão e vão por OTA.
- `eas.json` (já existia): perfis `development` / `preview` / `production` com `channel`.
- Banner de atualização nativa montado nos dois `_layout` + `landing/version.json`.

## Passos que dependem da SUA conta Expo (interativos)

```bash
# uma vez, por app (dir apps/customer e apps/provider):
npx eas-cli login                 # sua conta Expo
npx eas-cli init                  # cria o projeto EAS, grava extra.eas.projectId no app.json
npx eas-cli update:configure      # grava updates.url = https://u.expo.dev/<projectId>
```

### Provider (funciona direto — sem ViroReact)
```bash
cd apps/provider
npx eas-cli build -p android --profile preview     # gera o APK (com expo-updates) no canal "preview"
# depois, pra empurrar correção de JS na hora:
npx eas-cli update --branch preview -m "descrição do fix"
```

### Customer (tem ViroReact — precisa de tratamento)
O `android/` do customer tem config **manual** do ViroReact (AARs via flatDir, pin do
Kotlin, registro `ReactViroPackage` no `MainApplication.kt`, `newArchEnabled=false`).
O EAS "managed" roda `expo prebuild` e **apaga** isso. Duas saídas:

- **(A) Bare workflow (mais rápido):** commitar o dir `android/` do customer (hoje é
  gitignored) para o EAS buildar o projeto nativo **como está**, sem prebuild. Requer
  tirar `apps/customer/android` do `.gitignore` e commitar.
- **(B) Config plugin (mais correto):** transformar a config do Viro (flatDir/kotlin/
  MainApplication/newArch) num **config plugin** do Expo, para o prebuild regenerar
  tudo certo. Mais trabalho, porém reprodutível.

Recomendo validar o OTA **primeiro no provider** (caminho limpo) e depois tratar o
customer pela opção (A) ou (B).

## Como o OTA funciona depois de configurado
1. Faz uma mudança **só de JS**.
2. `npx eas-cli update --branch <canal> -m "..."` publica o novo bundle.
3. Apps com a **mesma `runtimeVersion`** baixam a atualização no próximo launch
   (config atual: baixa em background, aplica no próximo abrir — `fallbackToCacheTimeout: 0`).

## Custo
EAS tem **free tier** (builds/mês com fila + EAS Update grátis dentro de limites),
suficiente para beta. Planos pagos removem a fila e sobem limites.
