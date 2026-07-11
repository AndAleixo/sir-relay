import { getTranslations } from "next-intl/server";
import { demoStyles } from "./landing.styles";

/** ponytail: CSS demo until /public/brand/demo.mp4 exists — swap for <video> then. */
export async function ProductDemo({ locale }: { locale: string }) {
  const t = await getTranslations();

  return (
    <div className={demoStyles.wrap}>
      <div className={demoStyles.frame} aria-label={t("landing.demoAria")}>
        <div className={demoStyles.chrome}>
          <span className={demoStyles.dot} />
          <span className={demoStyles.dot} />
          <span className={demoStyles.dot} />
          <span className={demoStyles.url}>{t("landing.demoUrl", { locale })}</span>
        </div>
        <div className={demoStyles.body}>
          <div className={demoStyles.column}>
            <p className={demoStyles.columnTitle}>{t("status.todo")}</p>
            <div className={`${demoStyles.card} landing-demo-card-a`}>{t("landing.demoTaskA")}</div>
          </div>
          <div className={demoStyles.column}>
            <p className={demoStyles.columnTitle}>{t("status.doing")}</p>
            <div className={`${demoStyles.card} ${demoStyles.cardActive} landing-demo-card-b`}>
              {t("landing.demoTaskB")}
            </div>
          </div>
          <div className={demoStyles.column}>
            <p className={demoStyles.columnTitle}>{t("status.done")}</p>
            <div className={`${demoStyles.card} landing-demo-card-c`}>{t("landing.demoTaskC")}</div>
          </div>
        </div>
      </div>
      <p className={demoStyles.caption}>{t("landing.demoCaption")}</p>
    </div>
  );
}
