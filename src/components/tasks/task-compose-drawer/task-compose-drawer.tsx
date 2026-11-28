"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import type { ManagedProject, Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { AI_SUGGEST_TEXT_MAX } from "@/lib/ai-suggest-quota";
import type { PendingCreateDraft } from "@/lib/ingest";
import type { TasksComposeMode } from "@/lib/tasks-url";
import { useFadeOpen } from "@/hooks/use-fade-open";
import {
  approvePendingCreatesAction,
  suggestTasksFromTextAction,
} from "@/app/actions/tasks";
import type {
  TaskFormAssigneeOption,
  TaskFormLabels,
} from "@/components/tasks/task-form";
import { Banner } from "@/components/ui/banner";
import { Button, buttonCompact } from "@/components/ui/button";
import { AiQuotaRing } from "./ai-quota-ring";
import { composeDrawerStyles as styles } from "./compose-drawer.styles";
import { fitTextareaHeight } from "./fit-textarea";
import { ManualComposeFields } from "./manual-compose-fields";
import { SuggestReviewCard } from "./suggest-review-card";

export type ComposeDrawerLabels = TaskFormLabels & {
  drawerTitle: string;
  aiDrawerTitle: string;
  close: string;
  save: string;
  accept: string;
  reject: string;
  acceptAll: string;
  rejectAll: string;
  aiReviewTitle: string;
  aiPlaceholder: string;
  aiSubmit: string;
  aiSuggesting: string;
  aiQuota: string;
  closeConfirm: string;
  errorSuggest: string;
  errorApprove: string;
  errorQuota: string;
  errorRate: string;
  errorTooLong: string;
};

type PendingItem = PendingCreateDraft & { localId: string };

/** Optional local create/suggest (demo) — skips server actions. */
export type ComposeDrawerLocalAdapters = {
  suggest: (
    text: string,
  ) => Promise<
    | { ok: true; drafts: PendingCreateDraft[]; remaining: number; limit: number }
    | {
        ok: false;
        error: "quota" | "rate" | "too_long" | "suggest";
        remaining?: number;
        limit?: number;
      }
  >;
  create: (
    drafts: PendingCreateDraft[],
  ) => Promise<{ ok: true; tasks: Task[] } | { ok: false }>;
};

type TaskComposeDrawerProps = {
  open: boolean;
  mode: TasksComposeMode;
  onClose: () => void;
  locale: string;
  isOperator: boolean;
  aiEnabled: boolean;
  aiRemaining: number;
  aiLimit: number;
  selfId: string;
  defaultProjectId: string | null;
  assigneeOptions: TaskFormAssigneeOption[];
  openProjects: ManagedProject[];
  labels: ComposeDrawerLabels;
  onCreated: (tasks: Task[]) => void;
  local?: ComposeDrawerLocalAdapters;
};

function newLocalId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDraft(
  selfId: string,
  projectId: string | null,
): PendingCreateDraft {
  return {
    title: "",
    description: "",
    assigneeId: selfId,
    dueDate: null,
    difficulty: null,
    projectId,
    categoryId: null,
  };
}

export function TaskComposeDrawer({
  open,
  mode,
  onClose,
  locale,
  isOperator,
  aiEnabled,
  aiRemaining,
  aiLimit,
  selfId,
  defaultProjectId,
  assigneeOptions,
  openProjects,
  labels,
  onCreated,
  local,
}: TaskComposeDrawerProps) {
  const isAi = mode === "ai";
  const [manual, setManual] = useState<PendingCreateDraft>(() =>
    emptyDraft(selfId, defaultProjectId),
  );
  const [aiItems, setAiItems] = useState<PendingItem[]>([]);
  const [aiText, setAiText] = useState("");
  const [remaining, setRemaining] = useState(aiRemaining);
  const [limit, setLimit] = useState(aiLimit);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"suggest" | "approve" | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = pending || busy !== null;
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);
  const chatRef = useRef<HTMLTextAreaElement>(null);
  const aiBlocked = remaining <= 0;

  // Reset drafts only on open/mode/defaults — not when quota props change
  // after a successful suggest (demo bumps aiUsed → would wipe aiItems).
  useEffect(() => {
    if (!open) return;
    setManual(emptyDraft(selfId, defaultProjectId));
    setAiItems([]);
    setAiText("");
    setError(null);
    setBusy(null);
  }, [open, mode, selfId, defaultProjectId]);

  useEffect(() => {
    if (!open) return;
    setRemaining(aiRemaining);
    setLimit(aiLimit);
  }, [open, aiRemaining, aiLimit]);

  useEffect(() => {
    if (!isAi) return;
    fitTextareaHeight(chatRef.current, 160);
  }, [aiText, open, isAi]);

  const projectOptions = useMemo(
    () =>
      openProjects.map((project) => ({
        id: project.id,
        label: `${project.acronym} · ${project.name}`,
      })),
    [openProjects],
  );

  function categoriesFor(projectId: string | null) {
    if (!projectId) return [];
    const project = openProjects.find((row) => row.id === projectId);
    return (project?.categories ?? []).map((category) => ({
      id: category.id,
      label: category.name,
    }));
  }

  function assigneeLabel(assigneeId: string): string {
    return (
      assigneeOptions.find((option) => option.id === assigneeId)?.label ??
      assigneeId
    );
  }

  function projectLabel(projectId: string | null): string | null {
    if (!projectId) return null;
    return (
      projectOptions.find((option) => option.id === projectId)?.label ?? null
    );
  }

  function categoryLabel(
    projectId: string | null,
    categoryId: string | null,
  ): string | null {
    if (!projectId || !categoryId) return null;
    return (
      categoriesFor(projectId).find((option) => option.id === categoryId)
        ?.label ?? null
    );
  }

  function difficultyLabel(
    difficulty: PendingCreateDraft["difficulty"],
  ): string | null {
    if (!difficulty) return null;
    if (difficulty === "easy") return labels.difficultyEasy;
    if (difficulty === "medium") return labels.difficultyMedium;
    return labels.difficultyHard;
  }

  function requestClose() {
    if (aiItems.length > 0 && !window.confirm(labels.closeConfirm)) return;
    onClose();
  }

  function runSuggest() {
    const text = aiText.trim();
    if (!text || locked || aiBlocked) return;
    if (text.length > AI_SUGGEST_TEXT_MAX) {
      setError(labels.errorTooLong);
      return;
    }
    setError(null);
    setBusy("suggest");
    startTransition(async () => {
      try {
        const result = local
          ? await local.suggest(text)
          : await suggestTasksFromTextAction(locale, text);
        if (!result.ok) {
          if (typeof result.remaining === "number") {
            setRemaining(result.remaining);
          }
          if (typeof result.limit === "number") {
            setLimit(result.limit);
          }
          if (result.error === "quota") setError(labels.errorQuota);
          else if (result.error === "rate") setError(labels.errorRate);
          else if (result.error === "too_long") setError(labels.errorTooLong);
          else setError(labels.errorSuggest);
          return;
        }
        setRemaining(result.remaining);
        setLimit(result.limit);
        setAiItems(
          result.drafts.map((draft) => ({
            ...draft,
            localId: newLocalId(),
          })),
        );
        setAiText("");
      } finally {
        setBusy(null);
      }
    });
  }

  function onChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    runSuggest();
  }

  function createDrafts(drafts: PendingCreateDraft[], clearAi: boolean) {
    if (locked) return;
    if (drafts.some((draft) => !draft.title.trim())) {
      setError(labels.errorApprove);
      return;
    }
    setError(null);
    setBusy("approve");
    startTransition(async () => {
      try {
        const result = local
          ? await local.create(drafts)
          : await approvePendingCreatesAction(locale, drafts);
        if (!result.ok) {
          setError(labels.errorApprove);
          return;
        }
        if (clearAi) setAiItems([]);
        else setManual(emptyDraft(selfId, defaultProjectId));
        onCreated(result.tasks);
        if (clearAi || drafts.length === 1) onClose();
      } finally {
        setBusy(null);
      }
    });
  }

  function createManual() {
    createDrafts([manual], false);
  }

  function acceptOne(localId: string) {
    const item = aiItems.find((row) => row.localId === localId);
    if (!item) return;
    const { localId: _id, ...draft } = item;
    setBusy("approve");
    startTransition(async () => {
      try {
        if (!draft.title.trim()) {
          setError(labels.errorApprove);
          return;
        }
        setError(null);
        const result = local
          ? await local.create([draft])
          : await approvePendingCreatesAction(locale, [draft]);
        if (!result.ok) {
          setError(labels.errorApprove);
          return;
        }
        setAiItems((prev) => {
          const next = prev.filter((row) => row.localId !== localId);
          if (next.length === 0) onClose();
          return next;
        });
        onCreated(result.tasks);
      } finally {
        setBusy(null);
      }
    });
  }

  function rejectOne(localId: string) {
    setAiItems((prev) => prev.filter((item) => item.localId !== localId));
  }

  function acceptAllAi() {
    const drafts = aiItems.map(({ localId: _id, ...draft }) => draft);
    createDrafts(drafts, true);
  }

  function rejectAllAi() {
    setAiItems([]);
  }

  const fieldLabels: TaskFormLabels = {
    title: labels.title,
    titlePlaceholder: labels.titlePlaceholder,
    assignee: labels.assignee,
    assigneeHint: labels.assigneeHint,
    dueDate: labels.dueDate,
    description: labels.description,
    descriptionPlaceholder: labels.descriptionPlaceholder,
    status: labels.status,
    overdue: labels.overdue,
    difficulty: labels.difficulty,
    difficultyNone: labels.difficultyNone,
    difficultyEasy: labels.difficultyEasy,
    difficultyMedium: labels.difficultyMedium,
    difficultyHard: labels.difficultyHard,
    project: labels.project,
    projectNone: labels.projectNone,
    category: labels.category,
    categoryNone: labels.categoryNone,
  };

  const quotaLabel = labels.aiQuota
    .replace("{remaining}", String(remaining))
    .replace("{limit}", String(limit));

  if (!rendered) return null;

  return (
    <div
      className={isAi ? styles.rootAi : styles.rootManual}
      role="presentation"
    >
      <button
        type="button"
        className={cn(
          styles.backdrop,
          visible ? styles.backdropMotionOpen : styles.backdropMotionClose,
          visible ? styles.backdropOpen : styles.backdropClosed,
        )}
        aria-label={labels.close}
        onClick={requestClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isAi ? labels.aiDrawerTitle : labels.drawerTitle}
        className={cn(
          styles.panel,
          isAi ? styles.panelAi : styles.panelManual,
          visible ? styles.panelMotionOpen : styles.panelMotionClose,
          visible
            ? styles.panelOpen
            : isAi
              ? styles.panelClosedAi
              : styles.panelClosedManual,
        )}
        onTransitionEnd={onTransitionEnd}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            {isAi ? labels.aiDrawerTitle : labels.drawerTitle}
          </h2>
          <div className="flex items-center gap-2">
            {isAi && aiEnabled ? (
              <AiQuotaRing
                remaining={remaining}
                limit={limit}
                label={quotaLabel}
              />
            ) : null}
            <button
              type="button"
              className={styles.closeBtn}
              aria-label={labels.close}
              onClick={requestClose}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className="h-4 w-4"
              >
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className={isAi && aiItems.length > 0 ? styles.body : styles.bodyHug}>
          {isAi && aiEnabled ? (
            <div className="space-y-2">
              <div className={styles.chat} data-tour="demo-compose-ai-input">
                <textarea
                  ref={chatRef}
                  className={styles.chatInput}
                  value={aiText}
                  onChange={(event) =>
                    setAiText(event.target.value.slice(0, AI_SUGGEST_TEXT_MAX))
                  }
                  onKeyDown={onChatKeyDown}
                  placeholder={labels.aiPlaceholder}
                  rows={1}
                  maxLength={AI_SUGGEST_TEXT_MAX}
                  disabled={locked || aiBlocked}
                  aria-label={labels.aiPlaceholder}
                />
                <button
                  type="button"
                  data-tour="demo-compose-ai-submit"
                  className={styles.chatSend}
                  disabled={locked || aiBlocked || !aiText.trim()}
                  aria-label={
                    busy === "suggest" ? labels.aiSuggesting : labels.aiSubmit
                  }
                  onClick={runSuggest}
                >
                  {busy === "suggest" ? (
                    <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-current/80" />
                  ) : (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden
                      className="h-4 w-4"
                    >
                      <path
                        d="M10 16V4m0 0l-4.5 4.5M10 4l4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.aiChrome}>
                <span className={styles.aiChars}>
                  {aiText.length}/{AI_SUGGEST_TEXT_MAX}
                </span>
              </div>
            </div>
          ) : null}

          {error ? <Banner variant="severity">{error}</Banner> : null}

          {isAi && aiItems.length > 0 ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {labels.aiReviewTitle}
                </h3>
                {aiItems.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className={buttonCompact}
                      disabled={locked}
                      onClick={acceptAllAi}
                    >
                      {labels.acceptAll}
                    </Button>
                    <Button
                      variant="secondary"
                      className={buttonCompact}
                      disabled={locked}
                      onClick={rejectAllAi}
                    >
                      {labels.rejectAll}
                    </Button>
                  </div>
                ) : null}
              </div>
              <ul className="space-y-1.5">
                {aiItems.map((item) => {
                  const project = projectLabel(item.projectId);
                  const category = categoryLabel(
                    item.projectId,
                    item.categoryId,
                  );
                  const difficulty = difficultyLabel(item.difficulty);
                  const meta = [
                    isOperator ? assigneeLabel(item.assigneeId) : null,
                    item.dueDate,
                    project,
                    category,
                    difficulty,
                  ].filter((value): value is string => Boolean(value));

                  return (
                    <li key={item.localId}>
                      <SuggestReviewCard
                        title={item.title}
                        description={item.description}
                        meta={meta}
                        difficulty={item.difficulty}
                        acceptLabel={labels.accept}
                        rejectLabel={labels.reject}
                        disabled={locked}
                        onAccept={() => acceptOne(item.localId)}
                        onReject={() => rejectOne(item.localId)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {!isAi ? (
            <ManualComposeFields
              labels={fieldLabels}
              isOperator={isOperator}
              locked={locked}
              assigneeOptions={assigneeOptions}
              projectOptions={projectOptions}
              categoryOptions={categoriesFor(manual.projectId)}
              values={{
                title: manual.title,
                description: manual.description,
                assigneeId: manual.assigneeId,
                dueDate: manual.dueDate,
                difficulty: manual.difficulty,
                projectId: manual.projectId,
                categoryId: manual.categoryId,
              }}
              onChange={(patch) =>
                setManual((prev) => ({ ...prev, ...patch }))
              }
            />
          ) : null}
        </div>

        <footer className={styles.footer}>
          {!isAi ? (
            <Button
              className={buttonCompact}
              data-tour="demo-compose-save"
              disabled={locked || !manual.title.trim()}
              onClick={createManual}
            >
              {labels.save}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            className={buttonCompact}
            disabled={locked}
            onClick={requestClose}
          >
            {labels.close}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
