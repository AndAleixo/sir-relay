# SRelay

**SirRelay** organizes your own work, or the work of a group. That work lives on [app.sirrelay.com](https://app.sirrelay.com). This extension (chrome name **SRelay**) makes those tasks easier to manage: your column stays in the sidebar, and a change here is the same task on the site.

**v1.0** uses `/connect` and `/api/v1/client/*`. Re-link after upgrading from 0.x.

The link code from **Link this editor** (`/connect`) is the same Bearer the [MCP](../mcp/README.md) can use — the extension is optional if you only want MCP.

## Set up

1. Open the **SRelay** icon in the activity bar.
2. Choose **Sign in**. The site links this editor.
3. If the editor does not open, copy the code on the site and use **I have a code**.

A new code replaces the previous one.

## What you can do

- Switch group, when you belong to more than one.
- Filter by project (default **Project** shows all). The choice is remembered per group.
- Add a task: title, assignee, project, difficulty, due date, description. With a project filter active, that project is pre-selected.
- Start a to-do or complete the one in progress.
- Change a task’s project from the acronym (lateral strip, like on the site). Untagged tasks use **+**.
- Open, clone, or delete a task from the ⋯ menu. Open on SRelay also sits in the view title bar.
- Edit a title. Escape cancels.
- Hide **Done**. It starts hidden.
- See the current in-progress task in the status bar, and a to-do count on the activity bar icon.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `sirrelay.url` | `https://app.sirrelay.com` | Origin of the SRelay app, with no path. |

## License

[FSL-1.1-MIT](https://github.com/AndAleixo/sir-relay/blob/main/LICENSE). Copyright 2026 Andre Aleixo.
