"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { useSyncOptional } from "./sync-provider";
import { syncBarStyles } from "./sync-bar.styles";

export function SyncBar() {
  const t = useTranslations("sync");
  const sync = useSyncOptional();

  if (!sync?.showBar) {
    return null;
  }

  const { syncState, pendingCount, syncNow, conflicts, resolveConflict } = sync;
  const isSyncing = syncState === "syncing";
  const isConflict = syncState === "conflict" && conflicts.length > 0;

  let message = t("pending", { count: pendingCount });

  if (isSyncing) {
    message = t("syncing");
  } else if (syncState === "failed") {
    message = t("failed", { count: pendingCount });
  } else if (isConflict) {
    message = t("conflict");
  }

  return (
    <div
      role="status"
      className={cn(
        syncBarStyles.root,
        isConflict || syncState === "failed"
          ? syncBarStyles.danger
          : syncBarStyles.warning,
      )}
    >
      <p className={syncBarStyles.message}>{message}</p>
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
            disabled={isSyncing}
            onClick={() => syncNow()}
          >
            {t("syncNow")}
          </Button>
        )}
      </div>
    </div>
  );
}
