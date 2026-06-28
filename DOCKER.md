# Guincho (walvee) Docker — running alongside lula

The guincho stack is configured to run **side-by-side with the lula stack** on the
same machine with **no conflicts**. This document explains how, what changed, and
how to run both at once.

## TL;DR

```bash
# lula (in its own repos) — owns :80 / :443 for *.lula.local
cd ~/lula/lula-core-be && docker compose up -d

# guincho (this repo) — everything on 19xxx, proxy on 19088
cd ~/guincho && docker compose up -d
```

Both stacks can be up at the same time.

## Why there was a conflict

The lula stack runs a Caddy reverse proxy that binds the host's **:80 and :443**
(`lula-core-be-caddy` and/or `lula-caddy-rev-proxy`) to serve `*.lula.local`.
The guincho `docker-compose.yml` previously also bound **:80** for its own
`*.walvee.local` proxy — so only one of the two stacks could start.

Everything else was already conflict-free:

| Concern | lula | guincho | Conflict? |
|---|---|---|---|
| Container names | `lula-*` | `guincho-*` / `walvee-*` | No |
| DB port | MySQL `3306` | Postgres `19432` | No |
| Redis | `6379` | — (uses DB queue) | No |
| App/web | `8080`, `9003`, `3000` | `19000` | No |
| Reverse proxy | **`80` / `443`** | **`80`** (was) | **Yes** |
| Networks | `172.18.3.0/24`, `172.18.4.0/24` | default (auto) | Possible |

## What changed (this repo)

All changes are in `docker-compose.yml` and `Caddyfile`:

1. **Reverse proxy off `:80`.** The `caddy` service now publishes `"19088:80"`
   instead of `"80:80"`. lula keeps `:80`/`:443`; guincho's proxy is reachable at
   port **19088**.
2. **Explicit project name.** Added `name: guincho` so the Compose project name is
   stable regardless of the directory it's run from.
3. **Isolated network + pinned subnet.** The default network is named `guincho` with
   subnet **`172.30.0.0/24`**, which does not overlap lula's `172.18.3.0/24` /
   `172.18.4.0/24`. Both stacks get fully isolated networks.
4. **Caddyfile header** updated to document the `:19088` access pattern.

No container names, volumes, or non-proxy ports changed, so existing data and the
mobile dev flow are unaffected.

## Guincho ports (host)

| Service | Container | Host port | Notes |
|---|---|---|---|
| API (Laravel) | `guincho-backend` | **19000** | Mobile apps connect here directly |
| Reverb (WebSocket) | `guincho-reverb` | **19080** | Mobile apps connect here directly |
| Proxy (Caddy) | `guincho-caddy` | **19088** | `*.walvee.local` (optional, web only) |
| Landing page | `guincho-landing` | **19090** | Static marketing site |
| Postgres | `guincho-db` | **19432** | |
| Queue worker | `guincho-queue` | — | No host port |

The Expo apps (`docker-compose.expo.yml` / `docker-compose.web.yml`) use `1918x` /
`1908x` ports and `walvee-*` names — also conflict-free.

## Accessing the proxy hostnames

Because the proxy is no longer on `:80`, the `*.walvee.local` URLs need the port:

1. Add to your hosts file (`/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1 walvee.local customer.walvee.local provider.walvee.local api.walvee.local admin.walvee.local reverb.walvee.local
   ```
2. Open e.g. `http://api.walvee.local:19088`, `http://walvee.local:19088` (landing).

> The **mobile apps do not use the proxy** — they hit `localhost:19000` (API) and
> `localhost:19080` (Reverb) directly (see `frontend/apps/*/src/config.ts`), so the
> port change does not affect them.

All host ports are set explicitly in `docker-compose.yml`. To change one (e.g. to
put guincho's proxy back on `:80` when lula is **not** running), edit the `ports:`
mapping for that service and re-run `docker compose up -d`.

## Common commands

```bash
docker compose up -d                 # start the guincho stack
docker compose ps                    # status
docker compose logs -f backend       # tail API logs
docker compose down                  # stop (keeps volumes/data)
docker compose config                # validate + view the resolved config
```
