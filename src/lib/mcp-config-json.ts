/** mcpServers snippet for Cursor / Claude Desktop / etc. */
export function buildMcpConfigJson(appUrl: string, token: string): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        sirrelay: {
          command: "npx",
          args: ["-y", "@sirrelay/mcp"],
          env: {
            SIRRELAY_TOKEN: token,
            SIRRELAY_URL: appUrl,
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}
