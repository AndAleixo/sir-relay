import { getTranslations } from "next-intl/server";
import { landingStyles as s } from "@/components/landing/landing.styles";

/** Decorative agent chat — create_task via MCP (same board as the sidebar). */
export async function McpChatPreview() {
  const t = await getTranslations();

  return (
    <aside className={s.mcpShell} aria-label={t("landing.editor.mcpPreviewLabel")}>
      <div className={s.ideTitlebar} aria-hidden="true">
        <span className={s.ideTraffic}>
          <span className={`${s.ideDot} ${s.ideDotClose}`} />
          <span className={`${s.ideDot} ${s.ideDotMin}`} />
          <span className={`${s.ideDot} ${s.ideDotMax}`} />
        </span>
        <p className={s.ideTitlebarLabel}>{t("landing.editor.mcpWindowTitle")}</p>
      </div>

      <div className={s.mcpBody}>
        <p className={s.mcpUser}>{t("landing.editor.mcpUserCreate")}</p>

        <div className={s.mcpTool}>
          <p className={s.mcpToolName}>
            <span className={s.mcpToolBadge}>MCP</span>
            create_task
          </p>
          <ul className={s.mcpToolResult}>
            <li>
              title:{" "}
              <span className={s.mcpArgValue}>{t("landing.editor.mcpNewTitle")}</span>
            </li>
            <li>
              dueDate: <span className={s.mcpArgValue}>{t("landing.editor.mcpNewDue")}</span>
            </li>
            <li>
              difficulty: <span className={s.mcpArgValue}>medium</span>
            </li>
            <li>
              project: <span className={s.mcpArgValue}>OPS</span>
            </li>
          </ul>
        </div>

        <p className={s.mcpAssistant}>{t("landing.editor.mcpAssistantCreated")}</p>

        <p className={s.mcpUser}>{t("landing.editor.mcpUserAsk")}</p>

        <div className={s.mcpTool}>
          <p className={s.mcpToolName}>
            <span className={s.mcpToolBadge}>MCP</span>
            list_tasks
          </p>
          <ul className={s.mcpToolResult}>
            <li>
              <span className={s.ideAcronym}>OPS</span>
              <span className={s.ideAcronymSep}>·</span>
              {t("landing.editor.mcpNewTitle")}
              <span className={s.mcpStatus}> · todo</span>
            </li>
            <li>
              <span className={s.ideAcronym}>OPS</span>
              <span className={s.ideAcronymSep}>·</span>
              {t("landing.demoTaskA")}
              <span className={s.mcpStatus}> · todo</span>
            </li>
            <li>
              <span className={s.ideAcronym}>OPS</span>
              <span className={s.ideAcronymSep}>·</span>
              {t("landing.demoTaskC")}
              <span className={s.mcpStatus}> · doing</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
