# SRelay — Microsoft Teams package

Upload file: **`srelay-teams.zip`** (this folder’s `manifest.json` + `color.png` + `outline.png`).

## Sideload (test in Teams)

1. Open Teams → **Apps** → **Manage your apps** → **Upload an app** → **Upload a custom app**.
2. Select `srelay-teams.zip`.
3. Open **SRelay** → personal tab **My work** (loads the live web board).

You need a Microsoft 365 account that allows custom app upload (tenant admin policy, or a trial tenant).

## Partner Center / Teams Store

The screenshot **Apps and games** is the **Windows / Xbox** store path. For Teams Store / Microsoft Marketplace:

1. In Partner Center, open **Office Store** / **Microsoft 365 and Copilot** (wording varies) — not “+ New product” under Apps and games for a Windows app.
2. Create a **Teams app** offer and upload the same ZIP.
3. Store listing still needs screenshots, test notes, and validation against [Teams Store guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/appsource/prepare/teams-store-validation-guidelines).

Partner Center account = correct. This ZIP = what you upload. Store approval is a separate step after sideload works.

## Icons

Same art as the VS Code extension / web brand — only resized for Teams (192 color, 32 white outline):

| Teams file | Size | Source |
|---|---|---|
| `color.png` | 192×192 | [`extensions/vscode/media/icon.png`](../vscode/media/icon.png) |
| `outline.png` | 32×32 white on transparent | [`extensions/vscode/media/icon.svg`](../vscode/media/icon.svg) (SR paths → white; Teams tints this in the app bar) |

## Rebuild ZIP

```bash
cd extensions/teams
zip -j srelay-teams.zip manifest.json color.png outline.png
```

`id` in `manifest.json` is the app GUID — keep it stable across versions; bump `version` when you resubmit.
