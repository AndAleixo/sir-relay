import { getTranslations } from "next-intl/server";
import { landingStyles as s } from "@/components/landing/landing.styles";

type EditorColumnPreviewProps = {
  /** Sidebar-only chrome when paired with the MCP preview. */
  compact?: boolean;
};

/** Decorative IDE chrome — matches the extension sidebar anatomy, not a live editor. */
export async function EditorColumnPreview({
  compact = false,
}: EditorColumnPreviewProps) {
  const t = await getTranslations();

  return (
    <aside className={s.ideShell} aria-label={t("landing.editor.previewLabel")}>
      <div className={s.ideTitlebar} aria-hidden="true">
        <span className={s.ideTraffic}>
          <span className={`${s.ideDot} ${s.ideDotClose}`} />
          <span className={`${s.ideDot} ${s.ideDotMin}`} />
          <span className={`${s.ideDot} ${s.ideDotMax}`} />
        </span>
        <p className={s.ideTitlebarLabel}>
          {compact ? t("landing.editor.extensionWindowTitle") : "SRelay"}
        </p>
      </div>

      <div className={compact ? s.ideWorkspaceCompact : s.ideWorkspace}>
        <div className={s.ideActivity} aria-hidden="true">
          <span className={`${s.ideActivityIcon} ${s.ideActivityIconActive}`} />
          <span className={s.ideActivityIcon} />
          <span className={s.ideActivityIcon} />
          <span className={s.ideActivityIcon} />
        </div>

        <div className={compact ? s.ideSidebar : s.ideSidebarWithEditor}>
          <header className={s.ideSidebarHead} aria-hidden="true">
            <p className={s.ideSidebarTitle}>{t("landing.editor.column")}</p>
            <p className={s.ideSidebarHint}>{t("common.appName")}</p>
          </header>

          <div className={s.ideSidebarBody}>
            <div className={s.ideBoardTop} aria-hidden="true">
              <div className={s.ideGroupPick}>
                <span className={s.ideFieldLabel}>{t("landing.editor.groupLabel")}</span>
                <span className={s.ideSelect}>{t("landing.editor.demoGroup")}</span>
              </div>
              <div className={s.ideToolbar}>
                <span className={s.ideSelectGrow}>{t("landing.editor.demoProject")}</span>
                <span className={s.ideAdd}>{t("landing.editor.addTask")}</span>
              </div>
            </div>

            <section className={s.ideSection}>
              <h3 className={s.ideSectionTitle}>{t("status.todo")}</h3>
              <article className={s.ideCard}>
                <span className={`${s.ideHandle} ${s.ideHandleHard}`} aria-hidden="true" />
                <div className={s.ideCardBody}>
                  <p className={s.ideCardTitle}>
                    <span className={s.ideAcronym}>OPS</span>
                    <span className={s.ideAcronymSep}>·</span>
                    {t("landing.demoTaskA")}
                  </p>
                  <p className={s.ideDue}>{t("tasks.overdue")}</p>
                </div>
              </article>
              <article className={s.ideCard}>
                <span className={`${s.ideHandle} ${s.ideHandleMedium}`} aria-hidden="true" />
                <div className={s.ideCardBody}>
                  <p className={s.ideCardTitle}>
                    <span className={s.ideAcronym}>OPS</span>
                    <span className={s.ideAcronymSep}>·</span>
                    {t("landing.demoTaskB")}
                  </p>
                </div>
              </article>
            </section>

            <section className={s.ideSection}>
              <h3 className={s.ideSectionTitle}>{t("status.doing")}</h3>
              <article className={`${s.ideCard} ${s.ideCardActive}`}>
                <span className={`${s.ideHandle} ${s.ideHandleEasy}`} aria-hidden="true" />
                <div className={s.ideCardBody}>
                  <p className={s.ideCardTitle}>
                    <span className={s.ideAcronym}>OPS</span>
                    <span className={s.ideAcronymSep}>·</span>
                    {t("landing.demoTaskC")}
                  </p>
                </div>
              </article>
            </section>
          </div>
        </div>

        {compact ? null : (
          <div className={s.ideEditor} aria-hidden="true">
            <div className={s.ideTabRow}>
              <span className={s.ideTab}>{t("landing.editor.codeTab")}</span>
            </div>
            <pre className={s.ideCode}>
              <code>
                <span className={s.ideCodeLine}>
                  <span className={s.ideCodeGutter}>12</span>
                  <span className={s.ideCodeKw}>const</span> next = queue.head()
                </span>
                <span className={s.ideCodeLine}>
                  <span className={s.ideCodeGutter}>13</span>
                  <span className={s.ideCodeKw}>if</span> (!next){" "}
                  <span className={s.ideCodeKw}>return</span>
                </span>
                <span className={s.ideCodeLine}>
                  <span className={s.ideCodeGutter}>14</span>
                  relay.send(next)
                </span>
                <span className={`${s.ideCodeLine} ${s.ideCodeLineDim}`}>
                  <span className={s.ideCodeGutter}>15</span>
                  {"// your other work stays on the web"}
                </span>
              </code>
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
