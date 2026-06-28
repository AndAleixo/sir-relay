# SirRelay

**SirRelay** is an app by **Sir** — a self-hosted task relay for small teams.

Relay de tarefas self-hosted para times de **2–5 pessoas**. **Uma web**, dois papéis: o **Operator** gere tudo; cada **Teammate** trabalha nas suas tarefas. No **Telegram**, o bot entrega **uma tarefa de cada vez** — ao responder `done`, a próxima da fila chega sozinha.

| | |
|---|---|
| **Marca** | Sir |
| **App** | SirRelay |
| **Repositório** | `sir-relay` |
| **Cores** | Amarelo `#EAB308` + cinza + preto + branco — [docs/BRAND.md](./docs/BRAND.md) |
| **Ícone** | `brand/icon.svg` — quadrado amarelo + **SirR** |
| **Logo compacta** | `brand/logo-compact.svg` — **SirR** + linha |
| **Logo estendida** | `brand/logo.svg` — **SirRelay** + linha |
| **Bot Telegram** | SirRelay (ex.: `@SirRelayBot`) |

---

## ⚠️ Antes de modificar o código

**Qualquer developer ou LLM que vá alterar este repositório deve ler a documentação em [`docs/`](./docs/) antes de escrever código.**

Estes ficheiros definem o produto, a UI, a arquitectura e a marca. Ignorá-los leva a implementações inconsistentes, features fora de scope ou regressões visuais. Ordem recomendada:

1. [**docs/REQUIREMENTS.md**](./docs/REQUIREMENTS.md) — o que o produto faz, regras de negócio, fases, API e permissões (**fonte da verdade**)
2. [**docs/UIUX.md**](./docs/UIUX.md) — layouts, boards, ecrãs, interacções e componentes
3. [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) — estrutura do código, rotas mock, mock → API
4. [**docs/BRAND.md**](./docs/BRAND.md) — cores, logos, tokens visuais

Só depois disso, se fores fazer deploy: [**docs/DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md).

---

## Documentação (`docs/`)

| Ficheiro | O que contém | Quando ler |
|----------|--------------|------------|
| [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) | Especificação completa: roles, relay queue, tasks, Telegram, fases 1–3, schema, API, permissões | **Sempre** — antes de qualquer feature ou bugfix de produto |
| [**UIUX.md**](./docs/UIUX.md) | Shell, boards (Operator vs Teammate), cards, formulários, empty states, componentes | Ao mudar páginas, layout ou fluxos de UI |
| [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | Pastas `src/`, rotas mock, `getServices()`, sync, task forms | Ao mudar estrutura, services ou integração mock/API |
| [**BRAND.md**](./docs/BRAND.md) | Identidade Sir, ícones vs logos, paleta, CSS tokens | Ao mudar cores, tipografia, logos ou componentes visuais |
| [**DEPLOY-DIGITALOCEAN.md**](./docs/DEPLOY-DIGITALOCEAN.md) | Deploy em Droplet DO: Docker Compose, PostgreSQL, Caddy, HTTPS | Ao preparar ou actualizar produção |

Desenvolvimento em **3 fases** — ver [REQUIREMENTS.md §3](./docs/REQUIREMENTS.md#3-development-phases):

- **Fase 1** — Workflow relay + deploy (produto utilizável)
- **Fase 2** — Segurança, audit log, hardening da VPS
- **Fase 3** — Novas features (backlog)

---

## O que é

Distribui tarefas operacionais e acompanha o andamento num único lugar — web para visão completa, Telegram para o trabalho rápido no dia a dia.

| Papel | Como usa |
|-------|----------|
| **Operator** | Web: gere teammates, cria tarefas (para teammates **ou para si**), vê Kanban/lista de tudo · Telegram opcional para **alertas** (tarefa concluída, vencida) |
| **Teammate** | **Telegram** (principal): recebe uma tarefa, responde, marca progresso com palavras-chave · **Web** (opcional): vê e atualiza **só as suas** tarefas |

### Fluxo relay

1. Operator cria um teammate e envia convite + link do Telegram  
2. Teammate ativa a conta e vincula o Telegram  
3. Operator cria tarefas atribuídas ao teammate — **só a primeira** é enviada no Telegram (fila)  
4. Teammate **responde** à mensagem (ex.: `feito`, `done`) → tarefa vira `done` → **próxima tarefa chega no Telegram**  
5. Operator e Teammate veem o mesmo estado na web  

Hospedagem: **DigitalOcean Droplet** (EU) — Docker Compose, PostgreSQL, Caddy (HTTPS). Ver [docs/DEPLOY-DIGITALOCEAN.md](./docs/DEPLOY-DIGITALOCEAN.md).

Idiomas: **inglês, espanhol e português** (`en`, `es`, `pt`).

---

## Stack (resumo)

- **Next.js** (App Router) + TypeScript + React
- **PostgreSQL** + Prisma
- **Telegram** (grammy, webhook)
- **Docker Compose** + Caddy

Detalhes em [REQUIREMENTS.md §10](./docs/REQUIREMENTS.md#10-tech-stack--repo-layout).

---

## Status do projeto

**Fase UI mock** — interface implementada com dados mock. Sem backend, Prisma, Docker ou Telegram ainda.

Rotas mock principais: `/admin`, tasks (board, criar, editar, eliminar), teammates, alerts, profile, settings. Ver [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` · login em `/admin` (`alex@example.com` / `ana@example.com`, qualquer senha).

---

## Licença

A definir.
