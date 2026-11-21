"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ManagedProject, Task } from "@/domain/types";
import type { PendingCreateDraft } from "@/lib/ingest";
import {
  approvePendingCreatesAction,
  suggestTasksFromTextAction,
} from "@/app/actions/tasks";
import {
  TaskFormFields,
  type TaskFormAssigneeOption,
  type TaskFormLabels,
} from "@/components/tasks/task-form";
import { Banner } from "@/components/ui/banner";
import { Button, buttonCompact } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { SuggestReviewCard } from "./suggest-review-card";

export type ComposeDrawerLabels = TaskFormLabels & {
  drawerTitle: string;
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
  closeConfirm: string;
  errorSuggest: string;
  errorApprove: string;
};

type PendingItem = PendingCreateDraft & { localId: string };

type TaskComposeDrawerProps = {
  open: boolean;
  onClose: () => void;
  locale: string;
  isOperator: boolean;
  aiEnabled: boolean;
  selfId: string;
  defaultProjectId: string | null;
  assigneeOptions: TaskFormAssigneeOption[];
  openProjects: ManagedProject[];
  labels: ComposeDrawerLabels;
  onCreated: (tasks: Task[]) => void;
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
  onClose,
  locale,
  isOperator,
  aiEnabled,
  selfId,
  defaultProjectId,
  assigneeOptions,
  openProjects,
  labels,
  onCreated,
}: TaskComposeDrawerProps) {
  const [manual, setManual] = useState<PendingCreateDraft>(() =>
    emptyDraft(selfId, defaultProjectId),
  );
  const [aiItems, setAiItems] = useState<PendingItem[]>([]);
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"suggest" | "approve" | null>(null);
  const [pending, startTransition] = useTransition();
  const locked = pending || busy !== null;

  useEffect(() => {
    if (!open) return;
    setManual(emptyDraft(selfId, defaultProjectId));
    setAiItems([]);
    setAiText("");
    setError(null);
    setBusy(null);
  }, [open, selfId, defaultProjectId]);

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
    if (!text || locked) return;
    setError(null);
    setBusy("suggest");
    startTransition(async () => {
      try {
        const result = await suggestTasksFromTextAction(locale, text);
        if (!result.ok) {
          setError(labels.errorSuggest);
          return;
        }
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
        const result = await approvePendingCreatesAction(locale, drafts);
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
        const result = await approvePendingCreatesAction(locale, [draft]);
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

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={labels.close}
        onClick={requestClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={labels.drawerTitle}
        className="relative flex h-full w-full max-w-lg flex-col border-l border-[var(--border)] bg-surface-card shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {labels.drawerTitle}
          </h2>
          <Button
            variant="secondary"
            className={buttonCompact}
            onClick={requestClose}
          >
            {labels.close}
          </Button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {aiEnabled ? (
            <div className="space-y-2">
              <Textarea
                value={aiText}
                onChange={(event) => setAiText(event.target.value)}
                placeholder={labels.aiPlaceholder}
                rows={3}
                disabled={locked}
              />
              <Button
                className={buttonCompact}
                disabled={locked || !aiText.trim()}
                onClick={runSuggest}
              >
                {busy === "suggest" ? labels.aiSuggesting : labels.aiSubmit}
              </Button>
            </div>
          ) : null}

          {error ? <Banner variant="severity">{error}</Banner> : null}

          {aiEnabled && aiItems.length > 0 ? (
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
                    project,
                    category,
                    item.dueDate,
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

          {aiItems.length === 0 ? (
            <section className="space-y-3">
              <TaskFormFields
                mode="create"
                idPrefix="manual"
                labels={fieldLabels}
                isOperator={isOperator}
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
            </section>
          ) : null}
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-[var(--border)] px-4 py-3">
          {aiItems.length === 0 ? (
            <Button
              className={buttonCompact}
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
