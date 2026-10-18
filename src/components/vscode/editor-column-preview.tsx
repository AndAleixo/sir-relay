import { getTranslations } from "next-intl/server";
import { landingStyles as s } from "@/components/landing/landing.styles";

export async function EditorColumnPreview() {
  const t = await getTranslations();

  return (
    <aside className={s.editorFrame} aria-label={t("landing.editor.previewLabel")}>
      <div className={s.editorBar}>
        <span className={s.editorDot} />
        <span className={s.editorDot} />
        <span className={s.editorDot} />
        <p className={s.editorLabel}>{t("landing.editor.column")}</p>
      </div>
      <div className={s.editorBody}>
        <section>
          <h2 className={s.editorSection}>{t("status.todo")}</h2>
          <p className={s.editorCard}>
            <span className={s.editorAcronym}>HOM</span> · {t("landing.demoTaskA")}
            <span className={`block ${s.editorDue}`}>{t("tasks.overdue")}</span>
          </p>
          <p className={s.editorCard}>
            <span className={s.editorAcronym}>HOM</span> · {t("landing.demoTaskB")}
          </p>
        </section>
        <section>
          <h2 className={s.editorSection}>{t("status.doing")}</h2>
          <p className={s.editorCard}>
            <span className={s.editorAcronym}>HOM</span> · {t("landing.demoTaskC")}
          </p>
        </section>
      </div>
    </aside>
  );
}
