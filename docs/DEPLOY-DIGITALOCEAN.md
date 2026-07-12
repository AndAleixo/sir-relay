# Deploy no DigitalOcean

Guia para publicar o SirRelay como **aplicação web com domínio público** num **Droplet** — Docker Compose + Caddy + PostgreSQL.

Visitantes acedem à **landing** (`https://app.teudominio.com/en-gb`); utilizadores autenticados entram na app. Stack alinhada com [REQUIREMENTS.md §4.1](./REQUIREMENTS.md#41-product-model--hosted-web-app-primary) e [§5.8](./REQUIREMENTS.md#58-deploy).

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
| A | `www` | IP do Droplet (opcional) |

Recomendado: subdomínio **`app`** (ex.: `app.teudominio.com`) para a aplicação; domínio raiz pode redireccionar para marketing ou site institucional Sir.

`APP_URL` = `https://app.teudominio.com` (sem barra final).  
`APP_DOMAIN` = `app.teudominio.com` (host only, para o Caddyfile).

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
# .env prod (APP_DOMAIN=app.srelay.com, etc.) — ver § exemplo abaixo
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
APP_URL=https://app.teudominio.com
APP_DOMAIN=app.teudominio.com
CADDY_EMAIL=admin@teudominio.com
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
| Backup DB | `scripts/backup-db.sh` — [REQUIREMENTS.md §6.5.1](./REQUIREMENTS.md#651-sql-backup-ops) |
| Reiniciar | `docker compose restart` |

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
- [ ] Backups: cron com `scripts/backup-db.sh` + cópia off-VPS (ou snapshots DO)

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
