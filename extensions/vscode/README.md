# SRelay

VS Code / Cursor extension for **SirRelay** ([app.sirrelay.com](https://app.sirrelay.com)). Chrome name **SRelay** — your column in the sidebar; changes here are the same tasks on the site.

## Set up

1. Open the **SRelay** icon in the activity bar → **Sign in**.
2. The site opens **`/connect`** (API keys). Create a named key (and optional groups).
3. Use **Open in the IDE**, or copy the secret and **I have a code** in the extension.

Keys are managed only on `/connect` (Profile links there). Same keys as the [MCP](../mcp/README.md).

## What you can do

- Switch group (when you belong to more than one)
- Filter by project (remembered per group; default shows all)
- Add a task (title, assignee, project, difficulty, due date, description)
- Start a to-do or complete the one in progress
- Change a task’s project from the acronym strip (**+** = untagged)
- Open, clone, or delete from ⋯ · Open on SirRelay in the title bar
- Edit a title (Escape cancels) · hide **Done** (starts hidden)
- Status bar: current in-progress · activity bar: to-do count

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `sirrelay.url` | `https://app.sirrelay.com` | App origin, no path |

## Related

- MCP: [`../mcp/`](../mcp/) (`npx @sirrelay/mcp`)
- Cursor Marketplace plugin: [`../cursor-plugin/`](../cursor-plugin/)

## License

[FSL-1.1-MIT](https://github.com/AndAleixo/sir-relay/blob/main/LICENSE). Copyright 2026 Andre Aleixo.
