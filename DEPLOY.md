# Deploy — chamafacil.app (Amazon Lightsail + CI/CD)

Landing + API Laravel + workers (queue, reverb, scheduler) rodando em Docker
Compose numa instância única do Lightsail, atrás do Caddy (HTTPS automático), com
deploy automático via GitHub Actions a cada push na `main`. O banco é o **Lightsail
Managed Database (PostgreSQL)** — fora do Compose, com backups próprios.

Arquivos que compõem o deploy:
- `docker-compose.prod.yml` — stack de produção (autônomo).
- `Caddyfile.prod` — reverse proxy + TLS automático (`chamafacil.app` e subdomínios).
- `.env.production.example` — vars de banco consumidas pelo compose (copiar para `.env`).
- `.github/workflows/deploy.yml` — pipeline de deploy por SSH.

> **Segurança:** a chave `LightsailDefaultKey-us-east-1.pem` **nunca** entra no
> git (`*.pem` está no `.gitignore`). Ela vira um GitHub Secret. Como essa chave
> já foi exposta, **rotacione-a** no console do Lightsail após o primeiro deploy.

---

## Parte A — Rede e DNS

1. **Static IP** (console Lightsail → aba *Networking* da instância → *Attach static IP*).
   Sem isso o IP público pode mudar e quebrar o DNS/deploy.
2. **Firewall** (mesma aba): abrir **HTTP (80)**, **HTTPS (443)** e **SSH (22)**.
3. **DNS** (no gerenciador do domínio `chamafacil.app`): registros **A** apontando
   para o Static IP:

   | Host | Tipo | Valor |
   |------|------|-------|
   | `chamafacil.app` (`@`) | A | `32.197.79.197` |
   | `www` | A | `32.197.79.197` |
   | `api` | A | `32.197.79.197` |
   | `admin` | A | `32.197.79.197` |
   | `reverb` | A | `32.197.79.197` |

   (Ou um único registro wildcard `*` → `32.197.79.197`.) O Caddy só consegue emitir
   o certificado TLS depois que o DNS estiver propagado.

---

## Parte B — Setup único do servidor (via SSH)

Conecte com a chave local (não commitada):

```bash
ssh -i ~/Downloads/LightsailDefaultKey-us-east-1.pem ec2-user@32.197.79.197
```

### 1. Docker + Compose (Amazon Linux 2023)

```bash
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user   # depois faça logout/login para valer

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
docker compose version   # confirma
```

### 2. Deploy key + clone (repositório privado)

O servidor precisa ser um **clone git** (o CI/CD faz `git fetch/reset`). Gere uma
chave no servidor e adicione a pública como **Deploy key** no GitHub (basta
**read-only**):

```bash
ssh-keygen -t ed25519 -C "lightsail-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub   # cole em GitHub -> repo -> Settings -> Deploy keys
git clone git@github.com:raul1934/services-marketplace.git ~/services-marketplace
cd ~/services-marketplace
```

(Já provisionado: deploy key "LIGHTSAIL" no repo e `~/services-marketplace` é um
clone rastreando `origin/main`.)

### 3. Variáveis de ambiente (não versionadas)

```bash
# Banco: Lightsail Managed Database (PostgreSQL). Pegue endpoint/usuário/senha em
# Lightsail -> Databases -> (seu banco) -> Connect, e preencha:
cp .env.production.example .env
nano .env        # DB_HOST=<endpoint>.rds.amazonaws.com, DB_DATABASE=dbmaster,
                 # DB_USERNAME=dbmasteruser, DB_PASSWORD=<senha do console>
                 # (Public mode pode ficar OFF: a instância conecta pela rede interna.)

# Laravel
cp backend/.env.example backend/.env   # se não existir, crie a partir do exemplo
nano backend/.env
```

Em `backend/.env`, no mínimo:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.chamafacil.app
APP_KEY=                      # gerado no passo 4
DB_CONNECTION=pgsql
# DB_HOST/PORT/DATABASE/USERNAME/PASSWORD vêm do ambiente do compose (.env da raiz)
# Reverb (WebSockets) — defina se for usar broadcasting:
REVERB_APP_ID=...
REVERB_APP_KEY=...
REVERB_APP_SECRET=...

# E-mail — SMTP da Hostinger, que já hospeda o e-mail do domínio.
# MX, SPF, DKIM e DMARC de chamafacil.app já apontam para lá: não há DNS a fazer.
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=adm@chamafacil.app
MAIL_PASSWORD=<senha da caixa>
MAIL_FROM_ADDRESS=adm@chamafacil.app
MAIL_FROM_NAME="Chama Fácil"

# Alerta de chamado sem cobertura (modo concierge)
CONCIERGE_ALERT_EMAIL=adm@chamafacil.app
```

`MAIL_FROM_ADDRESS` tem que ser a **mesma caixa** do `MAIL_USERNAME`. Enviar como
um endereço e autenticar como outro passa no envio e cai em spam na entrega —
que é pior do que falhar, porque parece ter funcionado.

Depois de subir, confirme que sai de verdade:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan mail:test voce@email.com
```

O comando imprime host, porta, remetente e caixa autenticada antes de tentar, e
avisa quando o remetente não bate. Envio aceito não é entrega: confira a caixa
de entrada **e o spam**.

> **Limite:** caixa gratuita da Hostinger entrega ~100 mensagens/dia. Sobra para
> alerta de operação e confirmação de cadastro. Não serve para o disparo de
> lançamento à lista inteira — para isso, um ESP transacional (Resend, SES,
> Brevo), com tratamento de bounce e cabeçalho de descadastro.

### 4. Primeiro boot

```bash
cd ~/services-marketplace
COMPOSE="docker compose -f docker-compose.prod.yml"

$COMPOSE build
$COMPOSE run --rm --no-deps backend composer install --no-dev --optimize-autoloader --no-interaction
$COMPOSE run --rm backend php artisan key:generate   # grava APP_KEY em backend/.env
$COMPOSE up -d
$COMPOSE exec -T backend php artisan migrate --force
$COMPOSE exec -T backend php artisan config:cache
```

Acompanhe a emissão do certificado: `$COMPOSE logs -f caddy`.

---

## Parte C — GitHub Secrets (para o CI/CD)

GitHub → repo → *Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
|--------|-------|
| `LIGHTSAIL_HOST` | Static IP da instância |
| `LIGHTSAIL_USER` | `ec2-user` |
| `LIGHTSAIL_SSH_KEY` | conteúdo **inteiro** do `.pem` (com as linhas `BEGIN/END`) |

A partir daí, todo push na `main` que altere `backend/`, `landing/`,
`docker-compose.prod.yml` ou `Caddyfile.prod` dispara o deploy automático.
Também dá para rodar manualmente em *Actions → Deploy to Lightsail → Run workflow*.

---

## Verificação (end-to-end)

```bash
curl -I https://chamafacil.app          # 200 + certificado válido (Let's Encrypt)
curl https://api.chamafacil.app/up      # health-check do Laravel
```

- Abrir `https://admin.chamafacil.app` → tela de login do Filament carrega.
- Enviar o formulário de waitlist na landing e conferir o registro no banco
  (`docker compose -f docker-compose.prod.yml exec backend php artisan tinker`).
- CI/CD: dar um push trivial na `main` e ver o workflow verde em *Actions*.

---

## Follow-ups (fora do escopo inicial)

- `php artisan serve` é servidor de dev (single-thread) — ok para tráfego baixo
  (landing/waitlist/admin). Para escalar: migrar para **FrankenPHP** ou **php-fpm + nginx**.
- Restringir CORS de `*` para `https://chamafacil.app` (`backend/config/cors.php`).
- Backups: o banco é o Lightsail Managed Database (PostgreSQL), com snapshots
  automáticos próprios do Lightsail — não há mais volume de banco local.
- **Rotacionar** a chave SSH exposta e atualizar o Secret `LIGHTSAIL_SSH_KEY`.
