# SRelay — Microsoft Teams

Sideload ZIP that opens the live SirRelay web board in a personal tab. Not a public Store listing unless you have company Partner Center (M365 / Copilot).

Upload file: **`srelay-teams.zip`** (`manifest.json` + `color.png` + `outline.png` in this folder).

## Sideload

1. Teams → **Apps** → **Manage your apps** → **Upload an app** → **Upload a custom app**
2. Select `srelay-teams.zip`
3. Open **SRelay** → tab **My work**

Needs a Microsoft 365 account that allows custom app upload.

## Icons

| File | Size | Source |
| --- | --- | --- |
| `color.png` | 192×192 | [`../vsix/media/icon.png`](../vsix/media/icon.png) |
| `outline.png` | 32×32 white | [`../vsix/media/icon.svg`](../vsix/media/icon.svg) |

## Rebuild ZIP

```bash
cd extensions/teams
zip -j srelay-teams.zip manifest.json color.png outline.png
```

Keep `id` in `manifest.json` stable; bump `version` when you resubmit.
