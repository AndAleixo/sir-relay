# Ambientes — os quatro modos de correr o SirRelay

**Propósito:** definir **quatro ambientes** distintos — o que corre em cada um, analogia, variáveis e quando subir de degrau.

**Companion docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [REQUIREMENTS.md](./REQUIREMENTS.md) · [DEPLOY-DIGITALOCEAN.md](./DEPLOY-DIGITALOCEAN.md)

**Estado actual:** UI + **dev-híbrido activo** (Prisma + `services/api` + Postgres) · Telegram relay · fila To do (`sort_order`) · convites com consentimento. Sign-up merge (P1-AUTH-13) ainda não.

---

## Os quatro ambientes

| # | Ambiente | Analogia | O que é |
|---|----------|----------|---------|
| 1 | **Dev mock** | **Maqueta** — bonita, nada é real | `npm run dev-mock` · dados em memória · zero Docker |
| 2 | **Dev híbrido** | **Oficina** — montas o motor (API) com ferramentas rápidas | `npm run dev-hybrid` · Postgres Docker · `NEXT_PUBLIC_SERVICE_MODE=api` |
| 3 | **Prod local** | **Test drive** — o carro completo na garagem | `docker compose up` · stack idêntico ao VPS |
| 4 | **Prod VPS** | **Estrada** — clientes reais | Droplet + domínio + HTTPS + Telegram |

```
  Dev mock          Dev híbrido         Prod local          Prod VPS
  (maqueta)         (oficina)           (test drive)        (estrada)
      │                 │                   │                   │
      │  UI polida       │  API + Prisma     │  smoke Docker     │  deploy
      └────────────────►└──────────────────►└──────────────────►
         mock              api                 api                 api
```

---

## Comparação rápida

| | **1 · Dev mock** | **2 · Dev híbrido** | **3 · Prod local** | **4 · Prod VPS** |
|---|------------------|---------------------|--------------------|------------------|
| **Objectivo** | Polish UI, demo, i18n | Desenvolver backend | Validar deploy completo | Utilizadores reais |
| **App** | `npm run dev-mock` | `npm run dev-hybrid` | Container `app` | Container `app` |
| **Base de dados** | Nenhuma (memória) | Postgres Docker (:5432) | Postgres container | Postgres container |
| **Docker** | Não | Só Postgres | Compose completo | Compose completo |
| **Proxy / TLS** | — | — | Caddy (local) | Caddy + Let's Encrypt |
| **`NEXT_PUBLIC_SERVICE_MODE`** | `mock` | `api` | `api` | `api` |
| **Telegram** | — | Bot teste + tunnel* | Bot staging (opcional) | Bot produção |
| **Persistência** | Reinicia com o Node | Volume Postgres | Volume Docker | Volume + backups |
| **Ficheiro env** | `.env` | `.env` | `.env` | `.env` no servidor |
| **Estado hoje** | Active | Active (API + Prisma) | Pending smoke | Pending pós smoke local |

\* Webhook Telegram em dev requer tunnel (ngrok / Cloudflare) ou testar só no VPS.

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
| Login demo | `sam@example.com` → `/groups` (2 grupos, painel abre) · `ana@example.com` → `/tasks` · activation: `mock-invite-carla` como Carla |
| Password demo | qualquer (mock ignora) |

**Usar para:** polish visual, roteiro de demo, fluxos user→group→role, gravação de vídeo.

**UI actual (mock):** painel de grupos no header — switch, create, join; leave/delete em **Settings**; erros inline; promote na ficha teammate; actions em `app/actions/*`.

**Não usar para:** provar persistência, migrations, Telegram real, performance de build Docker.

---

## 2 · Dev híbrido *(oficina)*

Postgres em Docker; app com hot reload no host. **`NEXT_PUBLIC_SERVICE_MODE=api`** — liga a `src/services/api/*` (Prisma).

```bash
cp .env.example .env
npm run dev-hybrid
# só postgres: npm run dev-hybrid-db
```

Exemplo `.env` (dev híbrido):

```env
NEXT_PUBLIC_SERVICE_MODE=api
DATABASE_URL=postgresql://sirrelay:DEV_PASSWORD@localhost:5432/sirrelay
POSTGRES_PASSWORD=DEV_PASSWORD
SESSION_SECRET=...   # openssl rand -base64 32
APP_URL=http://localhost:3000
```

| Item | Valor |
|------|-------|
| Postgres | `localhost:5432` via `docker-compose.dev.yml` |
| App | Node local — alterações em segundos |
| Telegram | Opcional; webhook precisa URL pública |

**Usar para:** implementar auth, groups, tasks, Prisma, debug SQL — dia-a-dia do backend.

**Hoje:** `npm run dev-hybrid` sobe Postgres, corre migrate + seed, e `next dev`. Login demo usa password **`demo12345`** (não qualquer string como no mock).

**Smoke mínimo:**

```bash
cp .env.example .env
npm run dev-hybrid
curl -s http://localhost:3000/api/v1/health
# browser: sam@example.com / demo12345
```

### Dev híbrido — checklist de prontidão

O script `scripts/env/dev-hybrid.sh` faz: validar env · subir Postgres · `prisma migrate deploy` · `prisma generate` · seed · `next dev`.

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 1 | Docker + `docker-compose.dev.yml` | Done | Postgres exposto em `:5432` |
| 2 | Scripts `dev-hybrid` / `dev-hybrid-db` | Done | `package.json` |
| 3 | `.env.example` secção 2 | Done | `DATABASE_URL`, `POSTGRES_PASSWORD`, `SESSION_SECRET` |
| 4 | UI + contratos (`UserGroup`, `GroupService`) | Done | Mock implementa; UI não muda no swap |
| 5 | Server actions `app/actions/*` | Done | Thin layer → `getServices()` |
| 6 | **`prisma/schema.prisma`** + migrations | Done | incl. `last_active_group_id` |
| 7 | **`prisma/seed.ts`** | Done | Paridade mock · password `demo12345` |
| 8 | Deps npm: `prisma`, `@prisma/client`, `bcrypt`, `jose`, `zod` | Done | Prisma 6.19 |
| 9 | **`src/services/api/*`** | Done | auth · groups · tasks · teammates · alerts · export |
| 10 | Ramo `api` em **`getServices()`** | Done | |
| 11 | **`GET /api/v1/health`** | Done | |
| 12 | Auth API + cookie jose | Done | Cookie `sirrelay_session` |
| 13 | Actions mode-agnostic | Done | `auth`, `groups`, `teammates`, `tasks`, `export`, `settings` |
| 14 | Sync bar → API tasks | Done | `apiTaskService` |
| 15 | Telegram webhook (link) | Done | `POST /api/v1/telegram/webhook` · P1-TG-01/06 |
| 16 | Telegram task relay + alert DMs | Done | P1-TG-02–05, 08–10 · `src/lib/telegram/relay.ts` |

**Smoke mínimo:**

```bash
npm run dev-hybrid
curl -s http://localhost:3000/api/v1/health   # → 200
# browser: sam@example.com / demo12345 → tasks (resume last group)
# promote teammate → Settings → leave group · delete group
```

---

## 3 · Prod local *(test drive)*

Réplica do stack de produção **na tua máquina**. Valida Dockerfile, Caddy, build standalone e migrations antes do VPS.

```bash
cp .env.example .env
chmod 600 .env
# Secção 3: Prod local

npm run prod-local
npm run prod-local-logs
npm run prod-local-down
```

| Serviço | Função |
|---------|--------|
| `postgres` | PostgreSQL 16 · volume `postgres_data` |
| `app` | Next.js standalone (`Dockerfile`) |
| `caddy` | Reverse proxy :80/:443 → `app:3000` |

**URLs locais:**

| Config | URL |
|--------|-----|
| `APP_DOMAIN=localhost` | `http://localhost` |
| `/etc/hosts`: `127.0.0.1 app.local` | `http://app.local` |

**Checklist antes de ir ao VPS:**

- [ ] `NEXT_PUBLIC_SERVICE_MODE=api`
- [ ] Migrations aplicadas (`prisma migrate deploy`)
- [ ] `curl http://localhost/api/v1/health` → 200
- [ ] Signup → grupo → tasks (acceptance test reduzido)
- [ ] Build Docker sem erros

**Reset de dados:** `docker compose down` mantém volume; `docker volume rm sir-relay_postgres_data` para limpar.

---

## 4 · Prod VPS *(estrada)*

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

Checklist: [DEPLOY-DIGITALOCEAN.md §10](./DEPLOY-DIGITALOCEAN.md#10-checklist-pós-deploy).

---

## Variáveis de ambiente

Modelo: **`.env.example`** → copiar para **`.env`** (único ficheiro local; gitignored). Nunca commitar `.env` com segredos.

### Matriz `NEXT_PUBLIC_SERVICE_MODE`

| Valor | `getServices()` | BD | Ambiente(s) |
|-------|-----------------|-----|-------------|
| `mock` | `src/services/mock/*` | Não | Dev mock |
| `api` | `src/services/api/*` | Sim | Dev híbrido · prod local · VPS |

Troca sem alterar UI — [ARCHITECTURE.md §Mock → API](./ARCHITECTURE.md#mock--api).

### Prod local vs VPS (mesmo `.env`, valores diferentes)

| Variável | Prod local | Prod VPS |
|----------|------------|----------|
| `APP_URL` | `http://app.local` | `https://app.sirrelay.com` |
| `APP_DOMAIN` | `app.local` | `app.sirrelay.com` |
| `CADDY_EMAIL` | opcional | email real (Let's Encrypt) |
| Resto | iguais | iguais |

`DATABASE_URL` no compose é injectada automaticamente:

```yaml
DATABASE_URL: postgresql://sirrelay:${POSTGRES_PASSWORD}@postgres:5432/sirrelay
```

---

## Ficheiros de infra

| Ficheiro | Ambiente(s) |
|----------|-------------|
| `docker-compose.yml` | Prod local · VPS |
| `docker-compose.dev.yml` | Dev híbrido (expõe Postgres :5432) |
| `Dockerfile` | Prod local · VPS |
| `Caddyfile` | Prod local · VPS |
| `.env.example` | Template (commitado) |
| `.env` | Local + prod (gitignored) |
| `scripts/env/dev-*.sh` · `prod-*.sh` | Um script por ambiente — ver tabela abaixo |
| `scripts/check-entry-routes.mjs` | Dev mock (CI) |
| `scripts/db/backup.sh` · `backup-offsite.sh` · `restore.sh` | VPS |

---

## Fluxo de trabalho

```
Dev mock ──► Dev híbrido ──► Prod local ──► Prod VPS
(maqueta)     (oficina)       (test drive)   (estrada)
  UI            API             Docker         público
 mock          api              api            api
```

### Dia-a-dia (Phase 1)

1. **Dev mock** — `npm run dev-mock` (UI rápida sem Docker)
2. **Dev híbrido** — `npm run dev-hybrid` (API + Postgres) — ver [checklist §2](./ENVIRONMENTS.md#dev-híbrido--checklist-de-prontidão)
3. `npm run lint` + `npm run check:routes` (+ `npm run check:queue` se mexeres na fila) antes de commit
4. **Prod local** — antes de merge grande ou release
5. **Prod VPS** — após smoke local OK

### Critérios para subir de degrau

| De → Para | Critério |
|-----------|----------|
| Mock → Híbrido | `services/api` com auth + groups + tasks; migrations + seed |
| Híbrido → Prod local | `docker compose up --build` OK; health + acceptance test |
| Prod local → VPS | Checklist [DEPLOY §10](./DEPLOY-DIGITALOCEAN.md#10-checklist-pós-deploy) |

---

## Telegram por ambiente

| Ambiente | Bot | Webhook |
|----------|-----|---------|
| Dev mock | — | — |
| Dev híbrido | Teste (@BotFather) | Tunnel → localhost |
| Prod local | Staging | Tunnel ou skip |
| Prod VPS | Produção | `https://APP_DOMAIN/api/v1/telegram/webhook` |

Registo webhook: [DEPLOY-DIGITALOCEAN.md §7](./DEPLOY-DIGITALOCEAN.md#7-telegram-webhook).

---

## Scripts npm

| Comando | Ambiente | O que faz |
|---------|----------|-----------|
| `npm run dev-mock` | Dev mock | Força `NEXT_PUBLIC_SERVICE_MODE=mock` · `next dev` |
| `npm run dev-hybrid` | Dev híbrido | Postgres + prisma (se existir) + `next dev` |
| `npm run dev-hybrid-db` | Dev híbrido | Só Postgres (:5432) |
| `npm run dev-hybrid-db-down` | Dev híbrido | Para containers dev |
| `npm run prod-local` | Prod local | `docker compose up --build` |
| `npm run prod-local-down` | Prod local | Para stack |
| `npm run prod-local-logs` | Prod local | Logs app + caddy |
| `npm run prod-vps` | Prod VPS (local) | Atalho → `scripts/env/prod-vps.sh` |

Fonte: `scripts/env/dev-mock.sh` · `dev-hybrid.sh` · `prod-local.sh` · `prod-vps.sh`

---

## Resumo — o que correr

| Quero… | Ambiente | Comando |
|--------|----------|---------|
| Polir UI / demo | **Dev mock** | `npm run dev-mock` |
| Desenvolver API | **Dev híbrido** | `npm run dev-hybrid` |
| Testar deploy | **Prod local** | `npm run prod-local` |
| Publicar | **Prod VPS** | `bash scripts/env/prod-vps.sh` no servidor (sem npm no host) |

---

## Backend — estado Phase 1

Ver [REQUIREMENTS.md §5](./REQUIREMENTS.md#5-phase-1--core-workflow--deploy) e [§9 API](./REQUIREMENTS.md#9-api-contract).

**Feito:** Prisma + seed + `services/api/*` + actions mode-agnostic + dev-híbrido smoke · fila To do (`sort_order` + DnD) · group invitations (consent) · Telegram link + task relay + operator alert DMs.

**Pendente / opcional:**

1. REST routes `/api/v1/*` além de health + Telegram webhook (UI usa server actions)
2. Sign-up merge com email `invited` (P1-AUTH-13/14)

**Telegram (feito):** link webhook + **task relay** (create/done/renotify/replies) + **operator alert DMs** — P1-TG-02–05, 08–10. Due alerts enviam DM quando um operator abre Tasks/Alerts (`syncDueAlerts`).

**Ops (feito no VPS):** `scripts/db/backup.sh` · `backup-offsite.sh` · `restore.sh` — cron diário **05:00** → Google Drive; restore já testado. Ver [DEPLOY-DIGITALOCEAN.md §9.1](./DEPLOY-DIGITALOCEAN.md).

**Smoke Telegram (VPS):** Profile → link bot → criar tarefa para ti (fila vazia) → DM → reply `feito` → próxima ou “all caught up” → se assignee teammate, operators linked recebem alerta.

**Smoke fila:** `npm run check:queue` · no board, arrastar To do (lista = insert por Y; chrome = append).

**Fronteira:** `contracts.ts` · `getServices()` · `app/actions/*` — UI igual em mock e API.

---

**Last updated:** 2026-07-19
