"use client";

import { cn } from "@/lib/cn";
import { taskCardStyles } from "@/components/tasks/task-card/task-card.styles";
import type { PendingCreateDraft } from "@/lib/ingest";

type SuggestReviewCardProps = {
  title: string;
  description: string;
  meta: string[];
  difficulty: PendingCreateDraft["difficulty"];
  acceptLabel: string;
  rejectLabel: string;
  disabled?: boolean;
  onAccept: () => void;
  onReject: () => void;
};

const actionBtn =
  "rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30 disabled:opacity-50";

function difficultyHandleClass(
  difficulty: PendingCreateDraft["difficulty"],
): string | undefined {
  if (difficulty === "easy") return taskCardStyles.dragHandleSpacerEasy;
  if (difficulty === "medium") return taskCardStyles.dragHandleSpacerMedium;
  if (difficulty === "hard") return taskCardStyles.dragHandleSpacerHard;
  return undefined;
}

export function SuggestReviewCard({
  title,
  description,
  meta,
  difficulty,
  acceptLabel,
  rejectLabel,
  disabled,
  onAccept,
  onReject,
}: SuggestReviewCardProps) {
  return (
    <article className={taskCardStyles.root}>
      <div className={taskCardStyles.layout}>
        <span
          className={cn(
            taskCardStyles.dragHandleSpacer,
            difficultyHandleClass(difficulty),
          )}
          aria-hidden
        />
        <div className={taskCardStyles.boardBody}>
          <div className={taskCardStyles.titleRow}>
            <p className={taskCardStyles.titleReadonly}>{title}</p>
          </div>
          {description ? (
            <p className={taskCardStyles.descriptionPreview}>{description}</p>
          ) : null}
          <div className={taskCardStyles.footer}>
            <div className={taskCardStyles.footerSlot}>
              {meta.length > 0 ? (
                <p className={taskCardStyles.dueReadonly}>{meta.join(" · ")}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1 self-end">
              <button
                type="button"
                className={cn(
                  actionBtn,
                  "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                )}
                disabled={disabled}
                onClick={onAccept}
              >
                {acceptLabel}
              </button>
              <button
                type="button"
                className={cn(
                  actionBtn,
                  "bg-[var(--severity-soft)] text-[var(--severity)] hover:bg-[var(--severity-soft-hover)]",
                )}
                disabled={disabled}
                onClick={onReject}
              >
                {rejectLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
