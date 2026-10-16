import { getTranslations } from "next-intl/server";
import { ProductDemoPlayer } from "./product-demo-player";
import { demoStyles } from "./landing.styles";

function ProductDemoBoard({
  demoUrl,
  caption,
  labels,
}: {
  demoUrl: string;
  caption: string;
  labels: {
    ariaLabel: string;
    todo: string;
    doing: string;
    done: string;
    taskA: string;
    taskB: string;
    taskC: string;
  };
}) {
  return (
    <div className={demoStyles.wrap}>
      <div className={demoStyles.frame} aria-label={labels.ariaLabel}>
        <div className={demoStyles.chrome}>
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.dot} aria-hidden />
          <span className={demoStyles.url}>{demoUrl}</span>
        </div>
        <div className={demoStyles.body}>
          <div className={`${demoStyles.column} ${demoStyles.columnMuted}`}>
            <p className={demoStyles.columnTitle}>{labels.todo}</p>
            <div className={`${demoStyles.card} landing-demo-card-a`}>{labels.taskA}</div>
          </div>
          <div className={`${demoStyles.column} ${demoStyles.columnFocus}`}>
            <p className={demoStyles.columnTitle}>{labels.doing}</p>
            <div className={`${demoStyles.card} ${demoStyles.cardActive} landing-demo-card-b`}>
              {labels.taskB}
            </div>
          </div>
          <div className={`${demoStyles.column} ${demoStyles.columnMuted}`}>
            <p className={demoStyles.columnTitle}>{labels.done}</p>
            <div className={`${demoStyles.card} landing-demo-card-c`}>{labels.taskC}</div>
          </div>
        </div>
      </div>
      <p className={demoStyles.caption}>{caption}</p>
    </div>
  );
}

export async function ProductDemo({ locale }: { locale: string }) {
  const t = await getTranslations();
  const demoUrl = t("landing.demoUrl", { locale });
  const caption = t("landing.demoCaption");
  const boardLabels = {
    ariaLabel: t("landing.demoAria"),
    todo: t("status.todo"),
    doing: t("status.doing"),
    done: t("status.done"),
    taskA: t("landing.demoTaskA"),
    taskB: t("landing.demoTaskB"),
    taskC: t("landing.demoTaskC"),
  };

  return (
    <ProductDemoPlayer
      ariaLabel={boardLabels.ariaLabel}
      demoUrl={demoUrl}
      caption={caption}
      pauseLabel={t("landing.demoPause")}
      playLabel={t("landing.demoPlay")}
      fallback={
        <ProductDemoBoard demoUrl={demoUrl} caption={caption} labels={boardLabels} />
      }
    />
  );
}
