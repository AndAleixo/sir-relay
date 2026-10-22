# SirRelay (Cursor plugin)

Cursor Marketplace package for **`@sirrelay/mcp`**: the agent can list, create, update, and delete your board tasks.

## Set up

1. Install from the Cursor Marketplace (or [local test](#local-test) below).
2. **Plugins → Configure**:
   - **Link token** — [app.sirrelay.com](https://app.sirrelay.com) → **Profile** → **API keys** → create → copy
   - **App origin** (optional) — default `https://app.sirrelay.com`
3. Chat: e.g. “list my SirRelay tasks”.

Same key as the [VS Code / Cursor extension](../vscode/). Treat it like a password.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_tasks` | Your column |
| `create_task` | Create (optional status) |
| `update_task` | Title / status / project |
| `delete_task` | Delete (`confirm: true`) |

Full MCP docs: [`../mcp/README.md`](../mcp/README.md).

## Local test

```bash
mkdir -p ~/.cursor/plugins/local/sirrelay
cp -R extensions/cursor-plugin/* ~/.cursor/plugins/local/sirrelay/
```

Reload Window → **Plugins → Configure** → paste the Profile key into **Link token**.

Requires [`@sirrelay/mcp`](https://www.npmjs.com/package/@sirrelay/mcp) on npm.

## License

FSL-1.1-MIT — see repo root `LICENSE`.
