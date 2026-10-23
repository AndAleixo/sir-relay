# `@sirrelay/mcp`

SirRelay MCP (stdio): list, create, update field-by-field, clone, and delete **your** board tasks from an AI client. Talks HTTPS to the app — the IDE extension is optional.

## Get a key

1. Sign in at [app.sirrelay.com](https://app.sirrelay.com)
2. Open **`/connect`** (or Profile → **Manage API keys**)
3. Create a named key (optional group scope) → copy once
4. Paste into `SIRRELAY_TOKEN` (treat like a password)

After create you can also **Open in the IDE** for the IDE extension (same key).

## Install

```json
{
  "mcpServers": {
    "sirrelay": {
      "command": "npx",
      "args": ["-y", "@sirrelay/mcp"],
      "env": {
        "SIRRELAY_TOKEN": "paste-from-connect",
        "SIRRELAY_URL": "https://app.sirrelay.com"
      }
    }
  }
}
```

| Env | Required | Meaning |
| --- | --- | --- |
| `SIRRELAY_TOKEN` | yes | API key from `/connect` |
| `SIRRELAY_URL` | no | Default `https://app.sirrelay.com` |

Keep `mcp.json` out of git. Delete the key on `/connect` if leaked.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_tasks` | Your board (own tasks only; projects include category ids) |
| `create_task` | Full create: title + optional description, dueDate, project, category, difficulty, assignee, status |
| `set_task_status` | `todo` \| `doing` \| `done` |
| `set_task_title` | Rename |
| `set_task_description` | Replace (empty string clears) |
| `set_task_due_date` | `YYYY-MM-DD` (empty string clears) |
| `set_task_difficulty` | `easy` \| `medium` \| `hard` (empty string clears) |
| `set_task_project` | Project id (empty string clears; also clears category) |
| `set_task_category` | Category id for the task’s project (empty string clears) |
| `clone_task` | Duplicate |
| `delete_task` | Delete — requires `confirm: true` |

Each `set_*` tool changes **one** field so the agent only touches what you asked for. Authz stays on the server (same Bearer rules as the editor).

## Related

- Cursor Marketplace plugin: [`../cursor-plugin/`](../cursor-plugin/)
- IDE extension (VS Code, Cursor, Antigravity): [`../vsix/`](../vsix/)
- Publish (maintainers): [PUBLISH.md](./PUBLISH.md)

```bash
npm run check
```
