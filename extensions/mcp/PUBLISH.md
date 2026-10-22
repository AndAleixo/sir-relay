# Publish `@sirrelay/mcp` + Cursor plugin

User install steps live in [README.md](./README.md). This file is **maintainer** only.

## npm

Package: https://www.npmjs.com/package/@sirrelay/mcp

One-time (done for `@sirrelay`):

1. Org: https://www.npmjs.com/org/create → `sirrelay` → **Unlimited public packages**
2. 2FA: https://www.npmjs.com/settings/~/account

Each release:

```bash
cd extensions/mcp
npm run check
npm publish --access public
```

## Cursor Marketplace

Plugin: `extensions/cursor-plugin/` (+ root `.cursor-plugin/marketplace.json`).

1. Commit + push `https://github.com/AndAleixo/sir-relay`
2. Optional: copy to `~/.cursor/plugins/local/sirrelay`, Reload, configure key
3. Submit: https://cursor.com/marketplace/publish
4. Wait for Cursor review

## Also

- MCP Registry: https://github.com/modelcontextprotocol/registry (`mcpName` = `com.sirrelay/mcp`)
- https://cursor.directory
- Other IDEs: same `npx -y @sirrelay/mcp` + env as in the README

## Do not

- Commit real `SIRRELAY_TOKEN` values
