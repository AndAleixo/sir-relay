import { getTranslations } from "next-intl/server";
import { EditorColumnPreview } from "@/components/vscode/editor-column-preview";
import { McpChatPreview } from "@/components/vscode/mcp-chat-preview";
import { landingStyles } from "./landing.styles";

export async function LandingEditor() {
  const t = await getTranslations();

  return (
    <section className={landingStyles.editor} aria-labelledby="editor-title">
      <div className={landingStyles.editorInner}>
        <div className={landingStyles.editorCopy}>
          <h2 id="editor-title" className={landingStyles.editorTitle}>
            {t("landing.editor.title")}
          </h2>
          <p className={landingStyles.editorLead}>{t("landing.editor.subtitle")}</p>
          <p className={landingStyles.editorPoint}>{t("landing.editor.pointYours")}</p>
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
