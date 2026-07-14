# Deploy no DigitalOcean

Guia para publicar o SirRelay como **aplicação web com domínio público** num **Droplet** — Docker Compose + Caddy + PostgreSQL.

Visitantes acedem à **landing** (`https://app.sirrelay.com/en-gb`); utilizadores autenticados entram na app. Stack alinhada com [REQUIREMENTS.md §4.1](./REQUIREMENTS.md#41-product-model--hosted-web-app-primary) e [§5.8](./REQUIREMENTS.md#58-deploy).

**Companion docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [ENVIRONMENTS.md](./ENVIRONMENTS.md) · [README.md](../README.md)

**Ambientes (4):** dev mock · dev híbrido · prod local · prod VPS — [ENVIRONMENTS.md](./ENVIRONMENTS.md). Este guia cobre **prod VPS** (passos 6–10).

**Estado:** infra preparada; app em fase mock (landing + UI) — usar este guia quando a Fase 1 (API + Prisma) estiver pronta.

---

## 1. Droplet recomendado

| Opção | Spec | Quando |
|-------|------|--------|
| **Recomendado** | **4 GB RAM · 2 vCPU · 80 GB SSD** | Produção (app + Postgres + Caddy; Umami opcional depois) |
| Mínimo | 2 GB RAM · 1 vCPU | Testes / só app mock sem analytics |

**Imagem:** Ubuntu 24.04 LTS  
**Região:** **FRA1** (Frankfurt) ou **AMS3** (Amsterdam) — latência EU + RGPD  
**Autenticação:** SSH key (sem password root)  
**Backups:** activar **Weekly Backups** ou snapshots manuais (P2-OPS-04)

---

## 2. Criar o Droplet (painel DO)

1. [DigitalOcean](https://www.digitalocean.com/) → **Create** → **Droplets**
2. Região EU (Frankfurt ou Amsterdam)
3. Plano **Basic** → 4 GB / 2 vCPU
4. Adicionar a tua **SSH key**
5. Hostname sugerido: `sirrelay-prod`
6. Criar

Anotar o **IP público**.

---

## 3. Firewall (Cloud Firewall)

No painel DO → **Networking** → **Firewalls** → Create:

| Regra | Portas | Origem |
|-------|--------|--------|
| Inbound SSH | 22 | **O teu IP** (não `0.0.0.0/0` em produção) |
| Inbound HTTP | 80 | All IPv4, All IPv6 |
| Inbound HTTPS | 443 | All IPv4, All IPv6 |
| Outbound | All | All (default) |

Associar o firewall ao Droplet.

---

## 4. DNS

No teu domínio (DO DNS ou Cloudflare):

| Tipo | Nome | Valor |
|------|------|-------|
| A | `app` | IP do Droplet |
| A | `@` | IP do Droplet (apex — Caddy redirecciona para `app`) |
| A | `www` | IP do Droplet (Caddy redirecciona para `app`) |

Subdomínio **`app`** (`app.sirrelay.com`) serve a aplicação. **`sirrelay.com`** e **`www.sirrelay.com`** redireccionam para `app` (Caddy + `APP_ROOT_DOMAIN`).

`APP_URL` = `https://app.sirrelay.com` (sem barra final).  
`APP_DOMAIN` = `app.sirrelay.com` (host only, para o Caddyfile).  
`APP_ROOT_DOMAIN` = `sirrelay.com` (apex + www redirect).

Para analytics self-hosted (Fase 2, opcional): `A` → `analytics` → mesmo IP.

---

## 5. Preparar o servidor

**Script (recomendado)** — como `root` no Droplet:

```bash
# Depois de push para GitHub (repo privado — clone usa deploy key, §5.1):
git clone git@github.com:AndAleixo/sir-relay.git /tmp/sir-relay
bash /tmp/sir-relay/scripts/bootstrap-droplet.sh
```

Ou copia `scripts/bootstrap-droplet.sh` para o servidor e corre `bash bootstrap-droplet.sh`.

Manual (equivalente):

```bash
ssh root@SEU_IP
# … ver scripts/bootstrap-droplet.sh
```

Sair e continuar como `deploy`:

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

Alternativa: [Personal Access Token](https://github.com/settings/tokens) com `repo` e `git clone https://…` — menos ideal (token no histórico).

---

## 6. Deploy da aplicação

```bash
cd ~/sir-relay
# .env prod (APP_DOMAIN=app.sirrelay.com, etc.) — ver § exemplo abaixo
chmod 600 .env
bash scripts/env/prod-vps.sh
```

Gerar `SESSION_SECRET`:

```bash
openssl rand -base64 32
```

Exemplo `.env` produção:

```env
NEXT_PUBLIC_SERVICE_MODE=api
APP_URL=https://app.sirrelay.com
APP_DOMAIN=app.sirrelay.com
CADDY_EMAIL=admin@sirrelay.com
POSTGRES_PASSWORD=senha_forte_gerada
SESSION_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
```

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
# ou no servidor: npm run prod-vps
```

Caddy obtém certificado Let's Encrypt quando `APP_DOMAIN` aponta para o Droplet.

---

## 7. Telegram webhook

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${APP_URL}/api/v1/telegram/webhook" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
```

Verificar:

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

---

## 8. Health check

```bash
curl -s "${APP_URL}/api/v1/health"
```

---

## 9. Manutenção

| Tarefa | Comando |
|--------|---------|
| Actualizar app | `git pull && docker compose up -d --build` |
| Logs | `docker compose logs -f app caddy` |
| Backup DB | `scripts/db/backup.sh` — [REQUIREMENTS.md §6.5.1](./REQUIREMENTS.md#651-sql-backup-ops) |
| Backup + Drive | `scripts/db/backup-offsite.sh` — §9.1 |
| Restore DB | `scripts/db/restore.sh backups/….sql.gz` |
| Reiniciar | `docker compose restart` |

### 9.1 Backups off-VPS (Google Drive via rclone) — grátis

Corre **no droplet** (não no Mac). Não depende de VPN nem do teu PC.

**Instalar rclone:** já incluído em `scripts/bootstrap-droplet.sh`. Num droplet já criado:

```bash
# como root, se ainda não tiveres rclone
curl -fsSL https://rclone.org/install.sh | bash
```

**Uma vez — ligar à conta Google (como `deploy`):**

```bash
rclone config
```

No wizard:

1. `n` → nome: **`gdrive`**
2. Storage: **`Google Drive`** (número da lista)
3. `client_id` / `client_secret` → Enter (vazio)
4. Scope: **`1`** (Full access) ou **`2`** (só Drive) — preferir **`2`** se aparecer
5. `auto config` → **`n`** (headless no VPS)
6. rclone imprime um URL → abre no **teu Mac/browser**, faz login Google, copias o `code` de volta para o servidor
7. Team Drive? → **`n`**
8. Confirm → `y` → `q`

Cria pasta no Drive (no browser): `sirrelay-backups`.

**Teste:**

```bash
cd ~/sir-relay
RCLONE_REMOTE=gdrive:sirrelay-backups bash scripts/db/backup-offsite.sh
rclone ls gdrive:sirrelay-backups
```

**Cron (substitui o backup local-only):**

```bash
crontab -e
```

```
0 3 * * * cd /home/deploy/sir-relay && RCLONE_REMOTE=gdrive:sirrelay-backups bash scripts/db/backup-offsite.sh >>/home/deploy/sir-relay/backups/cron.log 2>&1
```

Retenção local: 7 dias (`BACKUP_RETAIN_DAYS`). No Drive os ficheiros acumulam — apaga manualmente ou:

```
# prune Drive older than 30d (opcional, num cron semanal)
# rclone delete gdrive:sirrelay-backups --min-age 30d
```

---

## 10. Checklist pós-deploy

- [ ] HTTPS activo (cadeado no browser)
- [ ] **Landing pública** em `/` ou `/en-gb` (sem login)
- [ ] Sign up / Log in no header → `/signup` · `/login` funcionam
- [ ] Novo utilizador → `/groups` → criar grupo
- [ ] Login demo `sam@example.com` → `/groups` (painel) → Demo Shop → `/teammates`
- [ ] Criar teammate → invite + link Telegram
- [ ] Webhook Telegram `ok`
- [ ] Relay: 2 tarefas → só 1ª no TG → `done` → 2ª chega
- [ ] Firewall SSH restrito ao teu IP
- [ ] `.env` mode `600`
- [ ] Backups: cron com `scripts/db/backup-offsite.sh` → Google Drive (rclone) + snapshot DO ocasional

---

## Ficheiros no repo

| Ficheiro | Função |
|----------|--------|
| `docker-compose.yml` | app + postgres + caddy (prod local + VPS) |
| `docker-compose.dev.yml` | override — expõe Postgres :5432 para dev híbrido |
| `Dockerfile` | Next.js standalone |
| `Caddyfile` | HTTPS reverse proxy |
| `.env.example` | Variáveis por ambiente — ver [ENVIRONMENTS.md](./ENVIRONMENTS.md) |
| `docs/ENVIRONMENTS.md` | Os quatro ambientes (mock · híbrido · prod local · VPS) |
| `public/brand/demo.webm` | Vídeo demo na landing — muted, loop; fallback CSS se falhar |
