# POC — Medição por RA + Foto 360°

Protótipos autocontidos (HTML único, sem dependências externas) do módulo de medição
para o marketplace. Abra os arquivos direto no navegador; no celular, permita câmera/giroscópio.

## Arquivos

- **`ar-medicao-360.html`** — POC principal. Cadastro de **Ativo (Casa/Apto/Comércio/Terreno)**
  com **cômodos nomeados** e persistência local. Por cômodo: medição de área/distância,
  desconto de aberturas (porta/janela), estimativa de material e orçamento consolidado do imóvel.
  Cada cômodo tem um viewer **360°** (WebGL equiretangular) com as medições salvas fixadas no espaço.
- **`pano360.html`** — POC isolado só do visualizador 360° (Sala/Cozinha/Quarto), com giroscópio e zoom.

## Observações técnicas

- Medida aqui é 2D calibrada (referência conhecida). Em produção: **ARCore/ARKit** (hit-test 3D, escala automática).
- Panorama 360° é **gerado por código** (sem imagem externa) só para provar a navegação;
  em produção troca-se pela foto equiretangular real (JPEG 2:1).
- Exibição roda no dev-build via `expo-gl`/three ou ViroReact (`Viro360Image`).
- Persistência via `localStorage` (fallback para memória no sandbox). No app: banco local + perfil do cliente.
