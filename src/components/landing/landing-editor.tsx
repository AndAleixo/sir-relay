import { getTranslations } from "next-intl/server";
import { EditorColumnPreview } from "@/components/vscode/editor-column-preview";
import { McpChatPreview } from "@/components/vscode/mcp-chat-preview";
import { getDownloadStats } from "@/lib/download-stats";
import { landingStyles } from "./landing.styles";

type LandingEditorProps = {
  locale: string;
};

export async function LandingEditor({ locale }: LandingEditorProps) {
  const t = await getTranslations();
  const stats = await getDownloadStats(locale);

  return (
    <section className={landingStyles.editor} aria-labelledby="editor-title">
      <div className={landingStyles.editorInner}>
        <div className={landingStyles.editorCopy}>
          <h2 id="editor-title" className={landingStyles.editorTitle}>
            {t("landing.editor.title")}
          </h2>
          <p className={landingStyles.editorLead}>{t("landing.editor.subtitle")}</p>
          <p className={landingStyles.editorPoint}>{t("landing.editor.pointYours")}</p>
          {stats.extension.label || stats.mcp.label ? (
            <p className={landingStyles.editorStats}>
              {stats.extension.label ? (
                <a
                  href={stats.extension.href}
                  className={landingStyles.editorStatLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("landing.editor.extensionInstalls", {
                    count: stats.extension.label,
                  })}
                </a>
              ) : null}
              {stats.extension.label && stats.mcp.label ? (
                <span aria-hidden>·</span>
              ) : null}
              {stats.mcp.label ? (
                <a
                  href={stats.mcp.href}
                  className={landingStyles.editorStatLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("landing.editor.mcpDownloads", {
                    count: stats.mcp.label,
                  })}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className={landingStyles.editorPreviews}>
          <figure className={landingStyles.editorFigure}>
            <figcaption className={landingStyles.editorCaption}>
              {t("landing.editor.extensionCaption")}
            </figcaption>
            <div className={landingStyles.editorPreviewGrow}>
              <EditorColumnPreview compact />
            </div>
          </figure>
          <figure className={landingStyles.editorFigure}>
            <figcaption className={landingStyles.editorCaption}>
              {t("landing.editor.mcpCaption")}
            </figcaption>
            <div className={landingStyles.editorPreviewGrow}>
              <McpChatPreview />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
