# Deploy no DigitalOcean

Guia para publicar o SirRelay como **aplicação web com domínio público** num **Droplet** — Docker Compose + Caddy + PostgreSQL.

Visitantes acedem à **landing** (`https://app.sirrelay.com/en-gb`); utilizadores autenticados entram na app. Stack alinhada com [REQUIREMENTS.md §4.1](./REQUIREMENTS.md#41-product-model--hosted-web-app-primary) e [§5.8](./REQUIREMENTS.md#58-deploy).

**Companion docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

**Ambientes (4):** dev mock · dev híbrido · prod local · prod VPS — [ENVIRONMENTS.md](./ENVIRONMENTS.md). Este guia cobre **prod VPS**.

**Estado (2026-07):** prod VPS em `app.sirrelay.com` — Docker + Caddy + Postgres; backups `scripts/db/*` → Google Drive (rclone); DNS na Network Solutions.

---

## 1. Droplet recomendado

| Opção | Spec | Quando |
|-------|------|--------|
| **Recomendado** | **4 GB RAM · 2 vCPU · 80 GB SSD** | Produção (app + Postgres + Caddy; Umami opcional depois) |
| Mínimo | 2 GB RAM · 1 vCPU | Testes / só app mock sem analytics |

**Imagem:** Ubuntu **24.04+** LTS (26.04 ok se Docker instalar)  
**Região:** **FRA1** (Frankfurt) ou **AMS3** (Amsterdam) — latência EU + RGPD  
**Autenticação:** SSH key (sem password root)  
**Backups DO:** snapshots manuais ou Weekly Backups (pago; opcional — usamos também `pg_dump` + Drive)

---

## 2. Criar o Droplet (painel DO)

1. [DigitalOcean](https://www.digitalocean.com/) → **Create** → **Droplets**
2. Região EU (Frankfurt ou Amsterdam)
3. Plano **Basic** → 4 GB / 2 vCPU
4. Adicionar a tua **SSH key**
5. Hostname sugerido: `sirrelay-prod` / `sir-relay-droplet`
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

**SSH vs Droplet Console:** o Web Console da DO liga à porta 22 a partir da infra DigitalOcean. Se SSH estiver só no **teu IP**, o Console costuma falhar; usa **All IPv4** no 22 se quiseres Console, ou Recovery Console + SSH por VPN/hotspot. Em algumas redes residenciais a **saída** na porta 22 é filtrada — NordVPN/Tailscale/hotspot para admin.

---

## 4. DNS

Registador actual: **Network Solutions** (não obrigatório usar DO DNS).

| Tipo | Nome | Valor |
|------|------|-------|
| A | `app` | IP do Droplet |
| A | `@` | IP do Droplet (apex — Caddy redirecciona para `app`) |
| A | `www` | IP do Droplet (Caddy redirecciona para `app`) |

Subdomínio **`app`** (`app.sirrelay.com`) serve a aplicação. **`sirrelay.com`** e **`www`** redireccionam via Caddy (`APP_ROOT_DOMAIN`).

```env
APP_URL=https://app.sirrelay.com
APP_DOMAIN=app.sirrelay.com
APP_ROOT_DOMAIN=sirrelay.com
```

Para analytics self-hosted (Fase 2, opcional): `A` → `analytics` → mesmo IP.

---

## 5. Preparar o servidor

Como **`root`** no Droplet:

```bash
# Opção A — script no repo (depois de teres clone em /tmp ou ~/…):
bash /home/deploy/sir-relay/scripts/bootstrap-droplet.sh
# ou: bash scripts/bootstrap-droplet.sh  (cwd = repo)

# Opção B — first boot sem clone:
# copia bootstrap-droplet.sh para o servidor e corre: bash bootstrap-droplet.sh
```

`bootstrap-droplet.sh` cria user **`deploy`**, instala **Docker** + **rclone** (idempotente).

Continuar como `deploy` (dia-a-dia **não** como root — evita “dubious ownership” no git):

```bash
su - deploy
```

### 5.1 Repo privado — deploy key (GitHub)

O repo [AndAleixo/sir-relay](https://github.com/AndAleixo/sir-relay) é **privado**. No Droplet, como **`deploy`**:

```bash
ssh-keygen -t ed25519 -C "sir-relay-droplet" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

GitHub → **sir-relay** → **Settings** → **Deploy keys** → **Add deploy key**:

- Title: `sirrelay-droplet`
- Key: cola o output de `cat` acima
- **Allow write access:** desligado (só `git pull`)

Teste:

```bash
ssh -T git@github.com   # “Hi AndAleixo/sir-relay! You've successfully authenticated…”
git clone git@github.com:AndAleixo/sir-relay.git
cd sir-relay
```

**Push só no Mac** → GitHub. No VPS só **`git pull`** como `deploy`.

---

## 6. Deploy da aplicação

```bash
cd ~/sir-relay
# .env prod — ver exemplo abaixo
chmod 600 .env
bash scripts/env/prod-vps.sh
```

(`npm run prod-vps` = mesmo script; **não** precisas de Node/npm no host — o deploy é Docker.)

Gerar `SESSION_SECRET`:

```bash
openssl rand -base64 32
```

Exemplo `.env` produção:

```env
NEXT_PUBLIC_SERVICE_MODE=api
APP_URL=https://app.sirrelay.com
APP_DOMAIN=app.sirrelay.com
APP_ROOT_DOMAIN=sirrelay.com
CADDY_EMAIL=admin@sirrelay.com
POSTGRES_PASSWORD=senha_forte_gerada
SESSION_SECRET=...
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

Caddy obtém certificado Let's Encrypt quando `APP_DOMAIN` (e apex, se configurado) apontam para o Droplet.

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
| Logs | `docker compose logs -f app caddy` |
| Backup DB | `bash scripts/db/backup.sh` |
| Backup + Drive | `bash scripts/db/backup-offsite.sh` — §9.1 |
| Restore DB | `bash scripts/db/restore.sh backups/….sql.gz` |
| Reiniciar | `docker compose restart` |

### 9.1 Backups off-VPS (Google Drive via rclone)

Corre **no droplet** como **`deploy`**. Não depende do Mac ligado.

**Instalar rclone:** `bootstrap-droplet.sh` (ou `curl -fsSL https://rclone.org/install.sh \| bash` como root).

**Uma vez — `rclone config` (como `deploy`, não root):**

1. `n` → nome **`gdrive`**
2. Storage: **Google Drive** (`24`)
3. `client_id` / `client_secret` → Enter (vazio)
4. Scope: **`1`**
5. Auto config browser? → **`n`** (VPS headless)
6. No servidor aparece: corre no **Mac**:
   ```bash
   rclone authorize "drive" "eyJzY29wZSI6ImRyaXZlIn0"
   ```
   Abre o browser, autoriza, copia o JSON e cola em `config_token>` no servidor
7. Shared Drive? → **`n`** → Keep → **`y`** → **`q`**

Cria pasta no Drive: **`sirrelay-backups`**.

**Teste:**

```bash
cd ~/sir-relay
RCLONE_REMOTE=gdrive:sirrelay-backups bash scripts/db/backup-offsite.sh
rclone ls gdrive:sirrelay-backups
```

**Cron:**

```
0 3 * * * cd /home/deploy/sir-relay && RCLONE_REMOTE=gdrive:sirrelay-backups bash scripts/db/backup-offsite.sh >>/home/deploy/sir-relay/backups/cron.log 2>&1
```

(03:00 **UTC** no Droplet.) Retenção local 7 dias; no Drive limpa manualmente ou `rclone delete gdrive:sirrelay-backups --min-age 30d`.

---


## Ficheiros no repo

| Ficheiro | Função |
|----------|--------|
| `docker-compose.yml` | app + postgres + caddy |
| `Caddyfile` | HTTPS + redirect apex/www |
| `scripts/bootstrap-droplet.sh` | user deploy + Docker + rclone |
| `scripts/env/prod-vps.sh` | git pull + migrate + compose up |
| `scripts/db/backup.sh` | `pg_dump` local |
| `scripts/db/backup-offsite.sh` | backup + rclone Drive |
| `scripts/db/restore.sh` | restore a partir de `.sql.gz` |
| `.env.example` | template — ver [ENVIRONMENTS.md](./ENVIRONMENTS.md) |
