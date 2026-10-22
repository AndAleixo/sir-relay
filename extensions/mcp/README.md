# `@sirrelay/mcp`

SirRelay MCP (stdio): list, create, update, and delete **your** board tasks from an AI client. Talks HTTPS to the app — the editor extension is optional.

## Get a key

1. Sign in at [app.sirrelay.com](https://app.sirrelay.com)
2. Open **`/connect`** (or Profile → **Manage API keys**)
3. Create a named key (optional group scope) → copy once
4. Paste into `SIRRELAY_TOKEN` (treat like a password)

After create you can also **Open in the IDE** for the VS Code / Cursor extension (same key).

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
| `list_tasks` | Your board (own tasks only) |
| `create_task` | Create (optional `status`: `todo` \| `doing` \| `done`) |
| `update_task` | `status`, `title`, and/or `projectId` (`""` clears project) |
| `delete_task` | Delete — requires `confirm: true` |

Authz stays on the server (same Bearer rules as the editor).

## Related

- Cursor Marketplace plugin: [`../cursor-plugin/`](../cursor-plugin/)
- VS Code / Cursor extension: [`../vscode/`](../vscode/)
- Publish (maintainers): [PUBLISH.md](./PUBLISH.md)

```bash
npm run check
```
