# Ambientes — os três modos de correr o SirRelay

**Propósito:** definir **três ambientes** — o que corre em cada um, variáveis e quando subir de degrau.

**Companion docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [REQUIREMENTS.md](./REQUIREMENTS.md) · [DEPLOY-DIGITALOCEAN.md](./DEPLOY-DIGITALOCEAN.md)

**Estado actual:** Três ambientes **Active** (mock · prod local · VPS). Phase 2 SEC + AUD + OPS · **Next 16** · P2-MON-01 · AUTH-13/14 · Umami · P3-17 email (ImprovMX + Resend).

---

## Os três ambientes

| # | Ambiente | Analogia | O que é |
|---|----------|----------|---------|
| 1 | **Dev mock** | **Maqueta** — bonita, nada é real | `npm run dev-mock` · dados em memória · zero Docker |
| 2 | **Prod local** | **Test drive** — o carro completo na garagem | stack Docker idêntico ao VPS |
| 3 | **Prod VPS** | **Estrada** — clientes reais | Droplet + domínio + HTTPS + Telegram |

```
  Dev mock ──────────────► Prod local ──────────────► Prod VPS
  (maqueta)                 (test drive)               (estrada)
      │                         │                          │
      │  UI / i18n rápida       │  API + Postgres + Caddy  │  deploy
      └────────────────────────►└──────────────────────────►
         mock                         api                        api
```

Fluxo de trabalho: **mock** para desenvolver depressa · **prod-local** para testar o ambiente completo · **VPS** para publicar. Não há modo “híbrido” (Postgres no Docker + `next dev` no host).

---

## Comparação rápida

| | **1 · Dev mock** | **2 · Prod local** | **3 · Prod VPS** |
|---|------------------|--------------------|------------------|
| **Objectivo** | Polish UI, demo, i18n | Validar stack completa | Utilizadores reais |
| **App** | `npm run dev-mock` | Container `app` | Container `app` |
| **Base de dados** | Nenhuma (memória) | Postgres container | Postgres container |
| **Docker** | Não | Compose completo | Compose completo |
| **Proxy / TLS** | — | Caddy `:80` | Caddy + Let's Encrypt |
| **`NEXT_PUBLIC_SERVICE_MODE`** | `mock` | `api` | `api` |
| **Telegram** | — | Staging (opcional) | Produção |
| **Umami** | — | Serviço + tracker se `UMAMI_WEBSITE_ID` | + `analytics.<apex>` |
| **Persistência** | Reinicia com o Node | Volume Docker | Volume + backups |
| **Ficheiro env** | `.env` | `.env` | `.env` no servidor |

\* Webhook Telegram em local requer tunnel (ngrok / Cloudflare) ou testar só no VPS.

---

## 1 · Dev mock *(maqueta)*

**Actual.** Sem Docker, sem Postgres. Dados em `src/services/mock/`; reiniciam ao parar o servidor.

```bash
cp .env.example .env   # se ainda não existir
npm run dev-mock
npm run check:routes
```

| Item | Valor |
|------|-------|
| URL | `http://localhost:3000` |
| Login demo | `sam@example.com` → `/groups` · `ana@example.com` → `/tasks` · activation: `mock-invite-carla` |
| Password demo | qualquer (mock ignora) |

**Usar para:** polish visual, roteiro de demo, fluxos user→group→role, gravação de vídeo.

**Mail (mock):** signup entra já “verificado”; forgot/reset/verify UI existem mas tokens/mail não são reais. Contact form → log se sem `MAIL_API_KEY`. Provar verify/reset de verdade → **prod-local** / VPS.

**Não usar para:** provar persistência, migrations, Telegram real, email transacional, build Docker.

---

## 2 · Prod local *(test drive)*

Réplica do stack de produção **na tua máquina**. Valida Dockerfile, Caddy, Umami, build standalone e migrations antes do VPS.

```bash
cp .env.example .env
chmod 600 .env
# Secção 2: Prod local (+ Umami no fim)

npm run prod-local
npm run prod-local-logs
npm run prod-local-down
```

| Serviço | Função |
|---------|--------|
| `postgres` | PostgreSQL 16 · volume `postgres_data` (DBs `sirrelay` + `umami`) |
| `umami` | Analytics · dashboard `:3001` · tracker via Caddy `/script.js` |
| `app` | Next.js standalone (`Dockerfile`) |
| `caddy` | Reverse proxy :80 → app; `/script.js` + `/api/send` → umami |

**URLs locais:**

| Config | URL |
|--------|-----|
| `APP_DOMAIN=localhost` | `http://localhost` |
| `/etc/hosts`: `127.0.0.1 app.local` | `http://app.local` |

Login demo (após seed): `sam@example.com` / **`SirRelay1`**.

**Checklist antes de ir ao VPS:**

- [ ] `NEXT_PUBLIC_SERVICE_MODE=api`
- [ ] `curl http://localhost/api/v1/health` → 200
- [ ] Signup → grupo → tasks
- [ ] Umami (opcional): dashboard + `UMAMI_WEBSITE_ID`
- [ ] Build Docker sem erros

**Reset de dados:** `docker compose down` mantém volume; `docker volume rm sir-relay_postgres_data` para limpar.

**Seed / prisma no host** (Postgres publicado em `:5433`):

```bash
DATABASE_URL=postgresql://sirrelay:$POSTGRES_PASSWORD@localhost:5433/sirrelay npx prisma db seed
```

---

## 3 · Prod VPS *(estrada)*

Deploy público. Guia completo: **[DEPLOY-DIGITALOCEAN.md](./DEPLOY-DIGITALOCEAN.md)**.

```
Internet → Caddy (:443) → app (:3000) → postgres (rede interna)
                              ↑
              Telegram  POST /api/v1/telegram/webhook
```

| Spec | 4 GB RAM · 2 vCPU · Ubuntu 24.04 · região EU (FRA1/AMS3) |
| URL | `https://app.sirrelay.com` |

```bash
ssh deploy@SEU_IP
cd sir-relay
bash scripts/env/prod-vps.sh    # git pull + migrate + docker compose up --build
```

Checklist: [DEPLOY-DIGITALOCEAN.md §10](./DEPLOY-DIGITALOCEAN.md#10-checklist-pos-deploy).

---

## Variáveis de ambiente

Modelo: **`.env.example`** → **`.env`** (gitignored). Nunca commitar segredos.

### Matriz `NEXT_PUBLIC_SERVICE_MODE`

| Valor | `getServices()` | BD | Ambiente(s) |
|-------|-----------------|-----|-------------|
| `mock` | `src/services/mock/*` | Não | Dev mock |
| `api` | `src/services/api/*` | Sim | Prod local · VPS |

Troca sem alterar UI — [ARCHITECTURE.md §Mock → API](./ARCHITECTURE.md#mock--api).

### Prod local vs VPS

| Variável | Prod local | Prod VPS |
|----------|------------|----------|
| `APP_URL` | `http://localhost` | `https://app.sirrelay.com` |
| `APP_DOMAIN` | `localhost` | `app.sirrelay.com` |
| `APP_ROOT_DOMAIN` | — | `sirrelay.com` |
| `CADDY_EMAIL` | opcional | email real (Let's Encrypt) |
| `CONTACT_EMAIL` | opt (`contact@sirrelay.com`) | Privacy/Terms + `/contact` destino |
| `MAIL_API_KEY` | opt (log-only sem chave) | Resend API key — [DEPLOY §4](./DEPLOY-DIGITALOCEAN.md#4-dns) |
| `MAIL_FROM` | opt (`noreply@sirrelay.com`) | From transacional |
| `UMAMI_APP_SECRET` | opt (default fraco no compose) | obrigatório (`prod-vps.sh`) |

`DATABASE_URL` no container `app` é injectada pelo compose:

```yaml
DATABASE_URL: postgresql://sirrelay:${POSTGRES_PASSWORD}@postgres:5432/sirrelay
```

---

## Ficheiros de infra

| Ficheiro | Ambiente(s) |
|----------|-------------|
| `docker-compose.yml` | Prod local · VPS |
| `docker-compose.local.yml` | Prod local (ports + Caddyfile.local) |
| `Dockerfile` | Prod local · VPS |
| `Caddyfile` / `Caddyfile.local` | VPS / prod local |
| `.env.example` | Template (commitado) |
| `.env` | Local + prod (gitignored) |
| `scripts/env/dev-mock.sh` · `prod-local.sh` · `prod-vps.sh` | Um script por ambiente |
| `scripts/db/backup.sh` · `backup-offsite.sh` · `restore.sh` | VPS (+ prod-local) |

---

## Fluxo de trabalho

```
Dev mock ──► Prod local ──► Prod VPS
(maqueta)     (test drive)   (estrada)
  UI            Docker         público
 mock          api            api
```

1. **Dev mock** — `npm run dev-mock` (UI rápida)
2. `npm run lint` + checks relevantes antes de commit
3. **Prod local** — testar API, Postgres, Caddy, Umami
4. **Prod VPS** — após smoke local OK

| De → Para | Critério |
|-----------|----------|
| Mock → Prod local | Feature estável em mock; smoke Docker + health |
| Prod local → VPS | Checklist [DEPLOY §10](./DEPLOY-DIGITALOCEAN.md#10-checklist-pos-deploy) |

---

## Telegram por ambiente

| Ambiente | Bot | Webhook |
|----------|-----|---------|
| Dev mock | — | — |
| Prod local | Staging | Tunnel ou skip |
| Prod VPS | Produção | `https://APP_DOMAIN/api/v1/telegram/webhook` |

Registo webhook: [DEPLOY-DIGITALOCEAN.md §7](./DEPLOY-DIGITALOCEAN.md#7-telegram-webhook).

---

## Scripts npm

| Comando | Ambiente | O que faz |
|---------|----------|-----------|
| `npm run dev-mock` | Dev mock | Força `mock` · `next dev` |
| `npm run prod-local` | Prod local | Stack Docker completa |
| `npm run prod-local-down` | Prod local | Para stack |
| `npm run prod-local-logs` | Prod local | Logs app + caddy + umami |
| `npm run prod-vps` | Prod VPS | Atalho → `scripts/env/prod-vps.sh` |

Fonte: `scripts/env/dev-mock.sh` · `prod-local.sh` · `prod-vps.sh`

---

## Resumo — o que correr

| Quero… | Ambiente | Comando |
|--------|----------|---------|
| Polir UI / demo | **Dev mock** | `npm run dev-mock` |
| Testar stack completa | **Prod local** | `npm run prod-local` |
| Publicar | **Prod VPS** | `bash scripts/env/prod-vps.sh` no servidor |

---

## Backend — estado Phase 1–2

Ver [REQUIREMENTS.md §5](./REQUIREMENTS.md#5-phase-1--core-workflow--deploy) · [§6 Phase 2](./REQUIREMENTS.md#6-phase-2--security-audit--operations) · [§9 API](./REQUIREMENTS.md#9-api-contract).

**Feito (Phase 1):** Prisma + seed + `services/api/*` + actions · fila To do · invitations · Telegram relay + alerts.

**Feito (Phase 2 SEC parcial):**
- P2-SEC-01–11 — incl. IDOR · safe JSON logging · **Next 16.2** (SEC-10 highs closed)
- P2-AUD-01–04 — `audit_logs` · `/events/activity` · `/platform`
- Demo seed password: **`SirRelay1`**

**Ops (feito):** P2-OPS-01–09 — [DEPLOY](./DEPLOY-DIGITALOCEAN.md).

**Umami:** P2-ANA-01–03 · tracker com `UMAMI_WEBSITE_ID` · DB via `ensure_umami_database`.

**Legal:** pacote canónico inglês [`legal/en.json`](../legal/en.json) · `users.terms_version` · gate `/accept-terms` · bump `version` para forçar re-aceite.

**Email (P3-17):** `/contact` · signup verify · forgot/reset · `sendMail` / Resend · ImprovMX inbound · `check:email-tokens`.

**Smoke (feito):** prod local + VPS · Telegram · fila · SEC · `/platform/login`.

**Fronteira:** `contracts.ts` · `getServices()` · `app/actions/*`.

---

**Last updated:** 2026-10-12 (P3-17 mail env; drop dead `MAIL_PROVIDER`)
