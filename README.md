# SirRelay

**SirRelay** is an app by **Sir** — a self-hosted task relay for small teams.

Relay de tarefas self-hosted para times de **2–5 pessoas**. **Uma web**, dois papéis: o **Operator** gere tudo; cada **Teammate** trabalha nas suas tarefas. No **Telegram**, o bot entrega **uma tarefa de cada vez** — ao responder `done`, a próxima da fila chega sozinha.

| | |
|---|---|
| **Marca** | Sir |
| **App** | SirRelay |
| **Repositório** | `sir-relay` |
| **Cores** | Amarelo `#EAB308` + cinza + preto + branco — [BRAND.md](./BRAND.md) |
| **Ícone** | `brand/icon.svg` — quadrado amarelo + **SirR** |
| **Logo compacta** | `brand/logo-compact.svg` — **SirR** + linha |
| **Logo estendida** | `brand/logo.svg` — **SirRelay** + linha |
| **Bot Telegram** | SirRelay (ex.: `@SirRelayBot`) |

---

## O que é

Distribui tarefas operacionais e acompanha o andamento num único lugar — web para visão completa, Telegram para o trabalho rápido no dia a dia.

| Papel | Como usa |
|-------|----------|
| **Operator** | Web: gere teammates, cria e edita tarefas, vê Kanban/lista de tudo, lê respostas |
| **Teammate** | **Telegram** (principal): recebe uma tarefa, responde, marca progresso com palavras-chave · **Web** (opcional): vê e atualiza **só as suas** tarefas |

### Fluxo relay

1. Operator cria um teammate e envia convite + link do Telegram  
2. Teammate ativa a conta e vincula o Telegram  
3. Operator cria tarefas atribuídas ao teammate — **só a primeira** é enviada no Telegram (fila)  
4. Teammate **responde** à mensagem (ex.: `feito`, `done`) → tarefa vira `done` → **próxima tarefa chega no Telegram**  
5. Operator e Teammate veem o mesmo estado na web  

Hospedagem: **VPS própria** (Docker Compose, PostgreSQL, HTTPS).

Idiomas: **inglês, espanhol e português** (`en`, `es`, `pt`).

---

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [**REQUIREMENTS.md**](./REQUIREMENTS.md) | Especificação completa — **fonte da verdade** para implementação |
| [**UIUX.md**](./UIUX.md) | Layouts, boards, telas, componentes |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Estrutura do código · mock → API |
| [**BRAND.md**](./BRAND.md) | Marca Sir, ícone vs logos, cores, assets SVG |

Desenvolvimento em **3 fases** — ver [REQUIREMENTS.md §3](./REQUIREMENTS.md#3-development-phases):

- **Fase 1** — Workflow relay + deploy (produto utilizável)
- **Fase 2** — Segurança, audit log, hardening da VPS
- **Fase 3** — Novas features (backlog)

---

## Stack (resumo)

- **Next.js** (App Router) + TypeScript + React
- **PostgreSQL** + Prisma
- **Telegram** (grammy, webhook)
- **Docker Compose** + Caddy

Detalhes em [REQUIREMENTS.md §10](./REQUIREMENTS.md#10-tech-stack--repo-layout).

---

## Status do projeto

**Fase UI mock** — interface implementada com dados mock. Sem backend ainda.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` · login mock (Operator / Teammate) · ver [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Licença

A definir.
