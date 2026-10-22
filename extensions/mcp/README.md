# `@sirrelay/mcp`

MCP server (stdio) for the signed-in user’s board: **list**, **create**, **update**, **delete**. Talks HTTPS to SirRelay; does **not** require the VS Code extension.

Brand: product **SirRelay**, chrome **SRelay**, npm `@sirrelay/mcp`.

## Get a token

1. Sign in → **`/[locale]/connect`** → copy the link code.
2. Put it in `SIRRELAY_TOKEN`. Treat it like a password (full board access for that user).

## Install (local until published)

```bash
cd extensions/mcp && npm install && npm run compile
```

```json
{
  "mcpServers": {
    "sirrelay": {
      "command": "node",
      "args": ["/absolute/path/to/sir-relay/extensions/mcp/out/index.js"],
      "env": {
        "SIRRELAY_TOKEN": "paste-link-token",
        "SIRRELAY_URL": "https://app.sirrelay.com"
      }
    }
  }
}
```

## Tools

| Tool | Purpose |
| --- | --- |
| `list_tasks` | Read your board (own tasks only) |
| `create_task` | Create (optional `status` after create: `todo` \| `doing` \| `done`) |
| `update_task` | Change `status`, `title`, and/or `projectId` (`""` clears project) |
| `delete_task` | Delete — requires `confirm: true` |

## Security (MCP)

- **Authz stays on the server** — same Bearer rules as the editor (`Forbidden` → 403). The MCP cannot bypass operator/teammate checks.
- **No SSRF** — `SIRRELAY_URL` is fixed at process start; tools never pass a URL.
- **Ids are validated** — only safe opaque ids (`task-…`, etc.); no path segments.
- **Delete friction** — `confirm` must be the boolean `true`.
- **No secrets in responses** — never echoes the token; board text is your column only.
- **Token hygiene** — keep `mcp.json` out of git; rotate via `/connect` if leaked.
- **Scope** — one user link token = that user’s groups/tasks only, not admin/platform.

## Env

| Variable | Required | Meaning |
| --- | --- | --- |
| `SIRRELAY_TOKEN` | yes | Link token from `/connect` |
| `SIRRELAY_URL` | no | Default `https://app.sirrelay.com` |

## Maintainers

```bash
npm run check
```
