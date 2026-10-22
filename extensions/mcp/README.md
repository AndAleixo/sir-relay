# `@sirrelay/mcp`

MCP server with **one tool**: `create_task`. Runs **locally via stdio**; calls the hosted SirRelay app over HTTPS. Does **not** require the VS Code / Cursor extension.

Brand: product **SirRelay**, chrome **SRelay**, npm scope `@sirrelay`.

## Get a token

1. Sign in on the site.
2. Open **Link this editor** at `/[locale]/connect`.
3. Copy the code. The same Bearer works for the editor extension **or** this MCP — neither needs the other.

## Install (until published to npm)

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

Local app: set `SIRRELAY_URL` to `http://localhost:3000`.

## Install (after `npm publish`)

```json
{
  "mcpServers": {
    "sirrelay": {
      "command": "npx",
      "args": ["-y", "@sirrelay/mcp"],
      "env": {
        "SIRRELAY_TOKEN": "paste-link-token",
        "SIRRELAY_URL": "https://app.sirrelay.com"
      }
    }
  }
}
```

See also `mcp.json.example`.

## Env

| Variable | Required | Meaning |
| --- | --- | --- |
| `SIRRELAY_TOKEN` | yes | Link token from `/connect`. |
| `SIRRELAY_URL` | no | App origin. Default `https://app.sirrelay.com`. |

## Tool

`create_task` — `title` required; optional `description`, `dueDate` (`YYYY-MM-DD`), `projectId`, `groupId`, `assigneeId`, `difficulty`.

## How it works

```
AI client ──stdio──► @sirrelay/mcp (on your machine)
                           │
                           │ HTTPS + Bearer
                           ▼
                    app.sirrelay.com
                 POST /api/v1/client/tasks
```

## Maintainers

```bash
npm run check          # compile + tests
npm publish            # prepublishOnly runs check; needs @sirrelay npm access
```

Later: Cursor Marketplace plugin wrapping the `npx` entry; MCP Registry via `mcpName` `com.sirrelay/mcp`.
