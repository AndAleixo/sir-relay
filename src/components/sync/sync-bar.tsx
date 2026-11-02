"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useSyncOptional } from "./sync-provider";
import { syncBarStyles } from "./sync-bar.styles";

/** One bar: only after silent sync failed (queue) or a version conflict. */
export function SyncBar() {
  const t = useTranslations("sync");
  const sync = useSyncOptional();

  if (!sync?.showBar) {
    return null;
  }

  const { pendingCount, busy, syncNow, conflicts, resolveConflict } = sync;
  const isConflict = conflicts.length > 0;

  return (
    <div
      role="status"
      className={cn(syncBarStyles.root, syncBarStyles.severity)}
    >
      <p className={syncBarStyles.message}>
        {isConflict
          ? t("conflict")
          : t("failed", { count: pendingCount })}
      </p>
      <div className={syncBarStyles.actions}>
        {isConflict ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className={syncBarStyles.button}
              onClick={() => resolveConflict(true)}
            >
              {t("keepLocal")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={syncBarStyles.button}
              onClick={() => resolveConflict(false)}
            >
              {t("useServer")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className={syncBarStyles.button}
            disabled={busy}
            onClick={() => syncNow()}
          >
            {t("syncNow")}
          </Button>
        )}
      </div>
    </div>
  );
}
