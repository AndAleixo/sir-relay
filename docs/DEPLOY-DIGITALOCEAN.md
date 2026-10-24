# Deploy no DigitalOcean

Guia **genérico** para publicar o SirRelay como aplicação web com domínio público num Droplet — Docker Compose + Caddy + PostgreSQL.

Visitantes acedem à landing; utilizadores autenticados entram na app. Stack alinhada com [REQUIREMENTS.md §4.1](./REQUIREMENTS.md#41-product-model--hosted-web-app-primary) e [§5.8](./REQUIREMENTS.md#58-deploy).

**Companion docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

**Ambientes (3):** dev mock · prod local · prod VPS — [ENVIRONMENTS.md](./ENVIRONMENTS.md). Este guia cobre **prod VPS**.

Não documenta o estado live de uma instalação concreta (cron, paths, remotos, registador). Isso fica fora do git.

---

## 1. Droplet recomendado

| Opção | Spec | Quando |
|-------|------|--------|
| **Recomendado** | **4 GB RAM · 2 vCPU · 80 GB SSD** | Produção (app + Postgres + Caddy + Umami) |
| Mínimo | 2 GB RAM · 1 vCPU | Smoke apertado (Umami incluído no compose — monitoriza RAM) |

**Imagem:** Ubuntu **24.04+** LTS  
**Região:** EU (ex. Frankfurt ou Amsterdam) — latência + RGPD  
**Autenticação:** SSH key (sem password root)  
**Backups DO:** snapshots manuais ou Weekly Backups (pago; opcional — o repo também tem `pg_dump` + offsite via rclone)

---

## 2. Criar o Droplet (painel DO)

1. [DigitalOcean](https://www.digitalocean.com/) → **Create** → **Droplets**
2. Região EU
3. Plano **Basic** → 4 GB / 2 vCPU
4. Adicionar a tua **SSH key**
5. Hostname à escolha (ex. `sirrelay-prod`)
6. Criar

Anotar o **IP público**.

---

## 3. Firewall (Cloud Firewall)

No painel DO → **Networking** → **Firewalls** → Create:

| Regra | Portas | Origem |
|-------|--------|--------|
| Inbound SSH | 22 | **All IPv4** *ou* o teu IP `/32` |
| Inbound HTTP | 80 | All IPv4, All IPv6 |
| Inbound HTTPS | 443 | All IPv4, All IPv6 |
| Outbound | All | All (default) |

Associar o firewall ao Droplet.

**Não** expor: `5432`, `3000`, nem porta SSH custom (ex. 2222).

**SSH vs Droplet Console:** o Web Console da DO liga à porta 22 a partir da infra DigitalOcean. Se SSH estiver só no teu IP, o Console costuma falhar — usa **All IPv4** no 22 se quiseres Console, ou Recovery Console / VPN para admin. Em algumas redes residenciais a saída na porta 22 é filtrada.

---

## 4. DNS

Usa o DNS do teu registador (não é obrigatório DigitalOcean DNS).

Substitui `example.com` / `app.example.com` pelo teu domínio.

| Tipo | Nome | Valor |
|------|------|-------|
| A | `app` | IP do Droplet |
| A | `@` | IP do Droplet (apex — Caddy redirecciona para `app`) |
| A | `www` | IP do Droplet (Caddy redirecciona para `app`) |
| A | `analytics` | IP do Droplet (dashboard Umami — opcional) |

O subdomínio **`app`** serve a aplicação. Apex e **`www`** redireccionam via Caddy (`APP_ROOT_DOMAIN`). Tracker Umami é same-origin em `app` (`/script.js`); o dashboard fica em **`analytics.<APP_ROOT_DOMAIN>`**.

```env
APP_URL=https://app.example.com
APP_DOMAIN=app.example.com
APP_ROOT_DOMAIN=example.com
CONTACT_EMAIL=contact@example.com
MAIL_API_KEY=...       # Resend (obrigatório na VPS para envio)
MAIL_FROM=noreply@example.com
UMAMI_APP_SECRET=...   # openssl rand -hex 32 (obrigatório no prod-vps.sh)
UMAMI_WEBSITE_ID=...   # Add website no Umami (domain = APP_DOMAIN)
```

### Email

**Não** corras MTA no Droplet. Só os `A` da app apontam para a DigitalOcean; MX/SPF/DKIM ficam no DNS do domínio.

#### Receber — `contact@…`

Forward inbound (ex. [ImprovMX](https://improvmx.com) ou equivalente) para a mailbox do operador:

| Tipo | Host | Valor | Prioridade |
|------|------|-------|------------|
| MX | `@` | (hosts do forwarder) | conforme o provider |
| TXT | `@` | SPF com `include` do forwarder | — |

`CONTACT_EMAIL` no `.env` (Privacy / Terms / formulário Contact).

#### Enviar — Resend

1. Conta [Resend](https://resend.com) → Add domain → DNS SPF/DKIM (e DMARC se pedirem). Junta o `include` Resend no **mesmo** TXT SPF do forwarder inbound.
2. From: `noreply@…` (só envio; sem mailbox).
3. `.env` VPS: `MAIL_API_KEY` · `MAIL_FROM`.

Sem `MAIL_API_KEY`, a app regista o envio em log (dev / prod-local); VPS deve ter chave.

---

## 5. Preparar o servidor

Como **`root`** no Droplet:

```bash
# Opção A — script no repo (cwd = clone):
bash scripts/bootstrap-droplet.sh

# Opção B — first boot sem clone:
# copia bootstrap-droplet.sh para o servidor e corre: bash bootstrap-droplet.sh
```

`bootstrap-droplet.sh` cria user **`deploy`**, instala **Docker** + **rclone** (idempotente).

Continuar como `deploy` (dia-a-dia **não** como root — evita “dubious ownership” no git):

```bash
su - deploy
```

### 5.1 Repo — clone no Droplet

O repo [AndAleixo/sir-relay](https://github.com/AndAleixo/sir-relay) é público. No Droplet, como **`deploy`**:

```bash
git clone https://github.com/AndAleixo/sir-relay.git
cd sir-relay
```

Push a partir da tua máquina → GitHub. No VPS só **`git pull`** como `deploy`.

---

## 6. Deploy da aplicação

```bash
cd ~/sir-relay
# .env prod — ver exemplo abaixo
chmod 600 .env
bash scripts/env/prod-vps.sh
```

(`bash scripts/env/prod-vps.sh` — **não** precisas de Node/npm no host; o deploy é Docker.)

Gerar `SESSION_SECRET`:

```bash
openssl rand -base64 32
```

Exemplo `.env` produção:

```env
NEXT_PUBLIC_SERVICE_MODE=api
APP_URL=https://app.example.com
APP_DOMAIN=app.example.com
APP_ROOT_DOMAIN=example.com
CADDY_EMAIL=admin@example.com
POSTGRES_PASSWORD=change-me-strong
SESSION_SECRET=...
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
PLATFORM_ADMIN_USERNAME=ops
PLATFORM_ADMIN_PASSWORD=change-me-min-8-chars   # login em /{locale}/platform/login
```

Caddy obtém certificado Let's Encrypt quando `APP_DOMAIN` (e apex, se configurado) apontam para o Droplet.

**Não** uses passwords de seed/demo (`SirRelay1`, etc.) em produção. Não corras `prisma db seed` na VPS pública.

---

## 7. Telegram webhook

Quando tiveres bot token:

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${APP_URL}/api/v1/telegram/webhook" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

---

## 8. Health check

```bash
curl -s "${APP_URL}/api/v1/health"
# esperado: {"ok":true,"service":"sirrelay"}
```

---

## 9. Manutenção

| Tarefa | Comando |
|--------|---------|
| Actualizar app | `git pull && bash scripts/env/prod-vps.sh` (como `deploy`) |
| Logs | `docker compose logs -f app caddy` · rotação `10m`×5 · correlacionar com `x-request-id` / `requestId` |
| Backup DB | `bash scripts/db/backup.sh` |
| Backup + offsite | `bash scripts/db/backup-offsite.sh` — §9.1 |
| Restore DB | `bash scripts/db/restore.sh backups/sirrelay-….sql.gz` (ou `umami-….sql.gz`) |
| Reiniciar | `docker compose restart` |

### Updates mensais (P2-OPS-09)

Uma vez por mês (ou após aviso de segurança):

```bash
# Host (Ubuntu)
sudo apt update && sudo apt upgrade -y

# App images + rebuild
cd ~/sir-relay
git pull
bash scripts/env/prod-vps.sh   # rebuild app + migrate + up
docker image prune -f
```

Confirmar depois: `curl -s "${APP_URL}/api/v1/health"` · login produto · (se aplicável) Telegram `getWebhookInfo`.

### 9.1 Backups off-VPS (object storage via rclone)

Corre **no droplet** como **`deploy`**. Não depende da tua laptop estar ligada.

**Instalar rclone:** `bootstrap-droplet.sh` (ou `curl -fsSL https://rclone.org/install.sh \| bash` como root).

**Uma vez — `rclone config` (como `deploy`, não root):**

1. `n` → nome do remote (ex. `offsite`)
2. Storage: provider à escolha (ex. Google Drive)
3. Segue o wizard do rclone (VPS headless → autoriza noutro browser e cola o token)
4. Cria uma pasta remota só para backups (nome à tua escolha)

**Teste:**

```bash
cd ~/sir-relay
RCLONE_REMOTE=offsite:your-backup-folder bash scripts/db/backup-offsite.sh
rclone ls offsite:your-backup-folder
# backup: produz sirrelay-*.sql.gz + umami-*.sql.gz (se a DB umami existir)
# restore: bash scripts/db/restore.sh backups/sirrelay-YYYYMMDD-HHMM.sql.gz
```

**Cron (exemplo — ajusta path e horário):**

```
0 5 * * * cd ~/sir-relay && RCLONE_REMOTE=offsite:your-backup-folder bash scripts/db/backup-offsite.sh >>~/sir-relay/backups/cron.log 2>&1
```

Retenção local 7 dias (`BACKUP_RETAIN_DAYS`); offsite inclui `sirrelay-*.sql.gz` e `umami-*.sql.gz`. Limpa o remoto periodicamente (ex. `rclone delete … --min-age 30d`).

---

## 10. Checklist pós-deploy

1. `curl -s "${APP_URL}/api/v1/health"` → `{"ok":true,"service":"sirrelay"}`
2. Login produto → criar ou entrar num grupo → tasks
3. Se `PLATFORM_ADMIN_*` no `.env`: `/{locale}/platform/login` → Overview / Audit
4. Telegram: `getWebhookInfo` OK (se bot activo)
5. Umami: `analytics.<APP_ROOT_DOMAIN>` → **Add website** (domain = `APP_DOMAIN`) → `UMAMI_WEBSITE_ID` no `.env` → `docker compose up -d app`
6. Backup: `bash scripts/db/backup.sh` (ou confirmar cron offsite §9.1)
7. Ops checklist (P2-OPS): firewall §3 · `chmod 600 .env` · `SESSION_SECRET` · Postgres só na rede `internal` · `USER nextjs` · updates mensais §9

---

## Ficheiros no repo

| Ficheiro | Função |
|----------|--------|
| `docker-compose.yml` | app + postgres + umami + caddy (`internal`; só 80/443 públicos) |
| `scripts/env/_common.sh` | `ensure_umami_database` — cria DB `umami` se faltar (prod-local / VPS) |
| `Dockerfile` | app non-root (`USER nextjs`) |
| `Caddyfile` | HTTPS + redirect apex/www |
| `scripts/bootstrap-droplet.sh` | user deploy + Docker + rclone |
| `scripts/env/prod-vps.sh` | git pull + migrate + compose up |
| `scripts/db/backup.sh` | `pg_dump` local |
| `scripts/db/backup-offsite.sh` | backup + rclone |
| `scripts/db/restore.sh` | restore a partir de `.sql.gz` |
| `.env.example` | template — ver [ENVIRONMENTS.md](./ENVIRONMENTS.md) |
