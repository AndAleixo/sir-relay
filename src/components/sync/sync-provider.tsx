"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "@/domain/types";
import type {
  MutationInput,
  PendingMutation,
  SyncConflict,
  TaskActionResult,
} from "@/domain/sync";
import { isRetryableSyncError } from "@/domain/sync";
import { executePendingMutation } from "@/lib/sync/execute-mutation";
import {
  applyServerTasks,
  shouldAcceptServerSnapshot,
} from "@/lib/sync/merge-tasks";
import {
  cloneTaskAction,
  deleteTaskInlineAction,
  quickCreateTaskAction,
} from "@/app/actions/tasks";
import { syncRetryMs } from "@/lib/sync/sync-config";

/** Shared by the app sync provider and the demo provider. */
export interface SyncContextValue {
  tasks: Task[];
  /** Queued writes after a silent failure (also drives the bar). */
  pendingCount: number;
  /** True only when the queue has items (silent sync already failed). */
  showBar: boolean;
  /** Replay / conflict resolve in flight — disables Try now. */
  busy: boolean;
  conflicts: SyncConflict[];
  syncFromServer: (serverTasks: Task[]) => void;
  applyTaskUpdate: (
    taskId: string,
    patch: Partial<Task>,
    mutations: MutationInput[],
  ) => Promise<void>;
  createTaskQuick: (
    locale: string,
    input: {
      title: string;
      assigneeId: string;
      assigneeName: string;
      projectId?: string | null;
      projectAcronym?: string | null;
    },
  ) => Promise<boolean>;
  cloneTask: (taskId: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  placeInTodoQueue: (
    taskId: string,
    assigneeId: string,
    orderedTodoIds: string[],
  ) => Promise<boolean>;
  syncNow: () => Promise<void>;
  resolveConflict: (keepLocal: boolean) => Promise<void>;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

function createMutation(
  input: MutationInput,
  baseUpdatedAt: string,
): PendingMutation {
  return {
    ...input,
    clientMutationId: crypto.randomUUID(),
    baseUpdatedAt,
  };
}

function mergeActionResult(
  tasks: Task[],
  result: Extract<TaskActionResult, { ok: true }>,
): Task[] {
  return applyServerTasks(tasks, result.affected ?? [result.task]);
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [queue, setQueue] = useState<PendingMutation[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [busy, setBusy] = useState(false);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const mutationInFlightRef = useRef(0);
  const tasksRef = useRef(tasks);
  const queueRef = useRef(queue);
  tasksRef.current = tasks;
  queueRef.current = queue;

  const pendingCount = queue.length;
  // Queue only fills after a silent attempt failed (or a conflict).
  const showBar = pendingCount > 0;

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(
    (run: () => void) => {
      clearRetryTimer();
      retryTimerRef.current = setTimeout(run, syncRetryMs);
    },
    [clearRetryTimer],
  );

  useEffect(() => {
    return () => clearRetryTimer();
  }, [clearRetryTimer]);

  const syncFromServer = useCallback((serverTasks: Task[]) => {
    if (
      !shouldAcceptServerSnapshot({
        queueLength: queueRef.current.length,
        inFlightCount: mutationInFlightRef.current,
      })
    ) {
      return;
    }
    setTasks(serverTasks);
  }, []);

  const enqueue = useCallback((mutation: PendingMutation) => {
    setQueue((prev) => {
      if (prev.some((m) => m.clientMutationId === mutation.clientMutationId)) {
        return prev;
      }
      return [...prev, mutation];
    });
  }, []);

  const dequeue = useCallback((clientMutationId: string) => {
    setQueue((prev) =>
      prev.filter((m) => m.clientMutationId !== clientMutationId),
    );
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInFlightRef.current) return;

    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) {
      clearRetryTimer();
      setConflicts([]);
      return;
    }

    syncInFlightRef.current = true;
    setBusy(true);

    let working = tasksRef.current;
    let hadFailure = false;

    for (const mutation of currentQueue) {
      if (
        !queueRef.current.some(
          (m) => m.clientMutationId === mutation.clientMutationId,
        )
      ) {
        continue;
      }

      mutationInFlightRef.current += 1;
      let result: TaskActionResult;
      try {
        result = await executePendingMutation(mutation);
      } finally {
        mutationInFlightRef.current = Math.max(
          0,
          mutationInFlightRef.current - 1,
        );
      }

      if (result.ok) {
        working = mergeActionResult(working, result);
        setTasks(working);
        dequeue(mutation.clientMutationId);
        continue;
      }

      if (result.error === "conflict") {
        setConflicts([{ mutation, serverTask: result.task }]);
        syncInFlightRef.current = false;
        setBusy(false);
        return;
      }

      if (!isRetryableSyncError(result.error)) {
        dequeue(mutation.clientMutationId);
        continue;
      }

      hadFailure = true;
      break;
    }

    syncInFlightRef.current = false;
    setBusy(false);

    if (queueRef.current.length === 0) {
      clearRetryTimer();
      setConflicts([]);
      return;
    }

    if (hadFailure) {
      scheduleRetry(() => {
        syncNow();
      });
    }
  }, [clearRetryTimer, dequeue, scheduleRetry]);

  const syncNowRef = useRef(syncNow);
  syncNowRef.current = syncNow;

  const runMutation = useCallback(
    async (
      mutation: PendingMutation,
      currentTasks: Task[],
      /** Pre-optimistic snapshot — restored on hard (non-retryable) failure. */
      revertTo?: Task[],
    ) => {
      mutationInFlightRef.current += 1;
      let result: TaskActionResult;
      try {
        result = await executePendingMutation(mutation);
      } finally {
        mutationInFlightRef.current = Math.max(
          0,
          mutationInFlightRef.current - 1,
        );
      }

      if (result.ok) {
        const merged = mergeActionResult(currentTasks, result);
        setTasks(merged);
        dequeue(mutation.clientMutationId);
        if (queueRef.current.length === 0) {
          clearRetryTimer();
          setConflicts([]);
        }
        return { ok: true as const, tasks: merged };
      }

      if (result.error === "conflict") {
        setConflicts([{ mutation, serverTask: result.task }]);
        enqueue(mutation);
        return { ok: false as const, error: "conflict" as const };
      }

      if (!isRetryableSyncError(result.error)) {
        if (revertTo) setTasks(revertTo);
        return { ok: false as const, error: result.error };
      }

      // Silent attempt failed — keep optimistic UI, show bar, retry later.
      enqueue(mutation);
      scheduleRetry(() => {
        syncNowRef.current();
      });
      return { ok: false as const, error: result.error };
    },
    [clearRetryTimer, dequeue, enqueue, scheduleRetry],
  );

  const applyTaskUpdate = useCallback(
    async (
      taskId: string,
      patch: Partial<Task>,
      mutationInputs: MutationInput[],
    ) => {
      const source = tasksRef.current;
      const original = source.find((t) => t.id === taskId);
      if (!original || mutationInputs.length === 0) return;

      const serverBases = new Map<string, string>();
      for (const input of mutationInputs) {
        if (serverBases.has(input.taskId)) continue;
        const baseTask = source.find((t) => t.id === input.taskId);
        if (baseTask) {
          serverBases.set(input.taskId, baseTask.updatedAt);
        }
      }

      let working = source.map((t) =>
        t.id === taskId
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t,
      );
      setTasks(working);

      for (const input of mutationInputs) {
        const baseUpdatedAt =
          serverBases.get(input.taskId) ?? original.updatedAt;
        const mutation = createMutation(input, baseUpdatedAt);
        const outcome = await runMutation(mutation, working, source);

        if (outcome.ok) {
          working = outcome.tasks;
          const updated = working.find((t) => t.id === input.taskId);
          if (updated) {
            serverBases.set(input.taskId, updated.updatedAt);
          }
        } else {
          break;
        }
      }
    },
    [runMutation],
  );

  const createTaskQuick = useCallback(
    async (
      locale: string,
      input: {
        title: string;
        assigneeId: string;
        assigneeName: string;
        projectId?: string | null;
        projectAcronym?: string | null;
      },
    ) => {
      const tempId = `task-pending-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimistic: Task = {
        id: tempId,
        title: input.title.trim(),
        description: "",
        assigneeId: input.assigneeId,
        assigneeName: input.assigneeName,
        status: "todo",
        difficulty: null,
        dueDate: null,
        telegramNotifyFailed: false,
        sortOrder: Number.MAX_SAFE_INTEGER,
        projectId: input.projectId ?? null,
        projectAcronym: input.projectAcronym ?? null,
        categoryId: null,
        categoryName: null,
        updatedAt: now,
        createdAt: now,
      };

      setTasks((prev) => [...prev, optimistic]);

      mutationInFlightRef.current += 1;
      let result: Awaited<ReturnType<typeof quickCreateTaskAction>>;
      try {
        result = await quickCreateTaskAction(locale, {
          title: input.title,
          assigneeId: input.assigneeId,
          projectId: input.projectId ?? null,
        });
      } finally {
        mutationInFlightRef.current = Math.max(
          0,
          mutationInFlightRef.current - 1,
        );
      }

      if (result.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? result.task : t)),
        );
        return true;
      }

      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      return false;
    },
    [],
  );

  const cloneTask = useCallback(async (taskId: string) => {
    mutationInFlightRef.current += 1;
    let result: Awaited<ReturnType<typeof cloneTaskAction>>;
    try {
      result = await cloneTaskAction(taskId);
    } finally {
      mutationInFlightRef.current = Math.max(0, mutationInFlightRef.current - 1);
    }
    if (!result.ok) return false;
    setTasks((prev) => applyServerTasks(prev, result.tasks));
    return true;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const snapshot = tasksRef.current;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    mutationInFlightRef.current += 1;
    let result: Awaited<ReturnType<typeof deleteTaskInlineAction>>;
    try {
      result = await deleteTaskInlineAction(taskId);
    } finally {
      mutationInFlightRef.current = Math.max(0, mutationInFlightRef.current - 1);
    }
    if (result.ok) return true;
    setTasks(snapshot);
    return false;
  }, []);

  const placeInTodoQueue = useCallback(
    async (taskId: string, assigneeId: string, orderedTodoIds: string[]) => {
      const source = tasksRef.current;
      const original = source.find((t) => t.id === taskId);
      if (!original) return false;

      const order = new Map(orderedTodoIds.map((id, i) => [id, i]));
      const now = new Date().toISOString();
      const assigneeName =
        source.find((x) => x.assigneeId === assigneeId)?.assigneeName ??
        original.assigneeName;

      const working = source.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            assigneeId,
            assigneeName,
            status: "todo" as const,
            sortOrder: order.get(taskId) ?? t.sortOrder,
            updatedAt: now,
          };
        }
        const sortOrder = order.get(t.id);
        return sortOrder === undefined ? t : { ...t, sortOrder, updatedAt: now };
      });
      setTasks(working);

      const mutation = createMutation(
        {
          type: "move_task",
          taskId,
          payload: {
            status: "todo",
            assigneeId,
            assigneeName,
            orderedTodoIds,
          },
        },
        original.updatedAt,
      );

      const outcome = await runMutation(mutation, working, source);
      return outcome.ok;
    },
    [runMutation],
  );

  const resolveConflict = useCallback(
    async (keepLocal: boolean) => {
      const conflict = conflicts[0];
      if (!conflict) return;

      if (keepLocal) {
        const refreshed = createMutation(
          {
            type: conflict.mutation.type,
            taskId: conflict.mutation.taskId,
            payload: conflict.mutation.payload,
          },
          conflict.serverTask.updatedAt,
        );
        dequeue(conflict.mutation.clientMutationId);
        setConflicts([]);
        await runMutation(refreshed, tasksRef.current);
      } else {
        setTasks((prev) => applyServerTasks(prev, [conflict.serverTask]));
        dequeue(conflict.mutation.clientMutationId);
        setConflicts([]);
        clearRetryTimer();
      }
    },
    [clearRetryTimer, conflicts, dequeue, runMutation],
  );

  useEffect(() => {
    function flushQueueIfNeeded() {
      if (queueRef.current.length === 0) return;
      syncNowRef.current();
    }

    function handleOnline() {
      flushQueueIfNeeded();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        flushQueueIfNeeded();
      }
    }

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (queueRef.current.length === 0 && mutationInFlightRef.current === 0) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      pendingCount,
      showBar,
      busy,
      conflicts,
      syncFromServer,
      applyTaskUpdate,
      createTaskQuick,
      cloneTask,
      deleteTask,
      placeInTodoQueue,
      syncNow,
      resolveConflict,
    }),
    [
      tasks,
      pendingCount,
      showBar,
      busy,
      conflicts,
      syncFromServer,
      applyTaskUpdate,
      createTaskQuick,
      cloneTask,
      deleteTask,
      placeInTodoQueue,
      syncNow,
      resolveConflict,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return ctx;
}

export function useSyncOptional() {
  return useContext(SyncContext);
}
