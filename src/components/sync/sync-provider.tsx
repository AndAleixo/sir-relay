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
  SyncState,
} from "@/domain/sync";
import { executePendingMutation } from "@/lib/sync/execute-mutation";
import {
  cloneTaskAction,
  deleteTaskInlineAction,
  placeInTodoQueueAction,
  quickCreateTaskAction,
} from "@/app/actions/tasks";
import {
  syncRetryConfig,
  syncRetryDelayMs,
} from "@/lib/sync/sync-config";

const { failuresBeforeBar: FAILURES_BEFORE_BAR } = syncRetryConfig;

interface SyncContextValue {
  tasks: Task[];
  syncState: SyncState;
  pendingCount: number;
  showBar: boolean;
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

const SyncContext = createContext<SyncContextValue | null>(null);

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

function mergeTaskResult(tasks: Task[], task: Task): Task[] {
  return tasks.map((t) => (t.id === task.id ? task : t));
}

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [queue, setQueue] = useState<PendingMutation[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("synced");
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [failureCount, setFailureCount] = useState(0);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const failureCountRef = useRef(0);
  const tasksRef = useRef(tasks);
  const queueRef = useRef(queue);
  tasksRef.current = tasks;
  queueRef.current = queue;

  const pendingCount = queue.length;

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const showBar =
    pendingCount > 0 &&
    (syncState === "conflict" ||
      syncState === "failed" ||
      failureCount >= FAILURES_BEFORE_BAR);

  const registerSyncSuccess = useCallback(() => {
    failureCountRef.current = 0;
    setFailureCount(0);
    clearRetryTimer();
  }, [clearRetryTimer]);

  const registerSyncFailure = useCallback(() => {
    failureCountRef.current += 1;
    const next = failureCountRef.current;
    if (next >= FAILURES_BEFORE_BAR) {
      setSyncState("failed");
    } else {
      setSyncState("syncing");
    }
    setFailureCount(next);
    return next;
  }, []);

  const scheduleRetry = useCallback(
    (run: () => void, failures: number) => {
      clearRetryTimer();
      retryTimerRef.current = setTimeout(run, syncRetryDelayMs(failures));
    },
    [clearRetryTimer],
  );

  useEffect(() => {
    return () => clearRetryTimer();
  }, [clearRetryTimer]);

  const syncFromServer = useCallback((serverTasks: Task[]) => {
    if (queueRef.current.length > 0) return;
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
    setQueue((prev) => prev.filter((m) => m.clientMutationId !== clientMutationId));
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInFlightRef.current) return;

    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) {
      registerSyncSuccess();
      setSyncState("synced");
      return;
    }

    syncInFlightRef.current = true;
    setSyncState("syncing");

    let working = tasksRef.current;
    let hadFailure = false;

    for (const mutation of currentQueue) {
      if (!queueRef.current.some((m) => m.clientMutationId === mutation.clientMutationId)) {
        continue;
      }

      const result = await executePendingMutation(mutation);

      if (result.ok) {
        working = mergeTaskResult(working, result.task);
        setTasks(working);
        dequeue(mutation.clientMutationId);
        continue;
      }

      if (result.error === "conflict") {
        setConflicts([{ mutation, serverTask: result.task }]);
        setSyncState("conflict");
        syncInFlightRef.current = false;
        return;
      }

      hadFailure = true;
      break;
    }

    syncInFlightRef.current = false;

    if (queueRef.current.length === 0) {
      registerSyncSuccess();
      setSyncState("synced");
      return;
    }

    if (hadFailure) {
      const failures = registerSyncFailure();
      scheduleRetry(() => {
        syncNow();
      }, failures);
    }
  }, [dequeue, registerSyncSuccess, registerSyncFailure, scheduleRetry]);

  const syncNowRef = useRef(syncNow);
  syncNowRef.current = syncNow;

  const runMutation = useCallback(
    async (mutation: PendingMutation, currentTasks: Task[]) => {
      const result = await executePendingMutation(mutation);

      if (result.ok) {
        const merged = mergeTaskResult(currentTasks, result.task);
        setTasks(merged);
        dequeue(mutation.clientMutationId);
        registerSyncSuccess();
        if (queueRef.current.length === 0) {
          setSyncState("synced");
        }
        return { ok: true as const, tasks: merged };
      }

      if (result.error === "conflict") {
        setConflicts([{ mutation, serverTask: result.task }]);
        setSyncState("conflict");
        enqueue(mutation);
        return { ok: false as const, error: "conflict" as const };
      }

      enqueue(mutation);
      const failures = registerSyncFailure();
      scheduleRetry(() => {
        syncNowRef.current();
      }, failures);
      return { ok: false as const, error: result.error };
    },
    [dequeue, enqueue, registerSyncSuccess, registerSyncFailure, scheduleRetry],
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
        const baseUpdatedAt = serverBases.get(input.taskId) ?? original.updatedAt;
        const mutation = createMutation(input, baseUpdatedAt);
        const outcome = await runMutation(mutation, working);

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
        updatedAt: now,
        createdAt: now,
      };

      setTasks((prev) => [...prev, optimistic]);

      const result = await quickCreateTaskAction(locale, {
        title: input.title,
        assigneeId: input.assigneeId,
        projectId: input.projectId ?? null,
      });

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
    const result = await cloneTaskAction(taskId);
    if (!result.ok) return false;
    setTasks(result.tasks);
    return true;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const snapshot = tasksRef.current;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteTaskInlineAction(taskId);
    if (result.ok) return true;
    setTasks(snapshot);
    return false;
  }, []);

  const placeInTodoQueue = useCallback(
    async (taskId: string, assigneeId: string, orderedTodoIds: string[]) => {
      const order = new Map(orderedTodoIds.map((id, i) => [id, i]));
      const snapshot = tasksRef.current;
      const now = new Date().toISOString();

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const assigneeName =
              prev.find((x) => x.assigneeId === assigneeId)?.assigneeName ??
              t.assigneeName;
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
        }),
      );

      const result = await placeInTodoQueueAction(
        taskId,
        assigneeId,
        orderedTodoIds,
      );
      if (result.ok) {
        setTasks(result.tasks);
        return true;
      }
      setTasks(snapshot);
      return false;
    },
    [],
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
        failureCountRef.current = 0;
        setFailureCount(0);
        await runMutation(refreshed, tasksRef.current);
      } else {
        setTasks((prev) => mergeTaskResult(prev, conflict.serverTask));
        dequeue(conflict.mutation.clientMutationId);
        setConflicts([]);
        registerSyncSuccess();
      }
    },
    [conflicts, dequeue, runMutation, registerSyncSuccess],
  );

  useEffect(() => {
    function handleOnline() {
      if (queueRef.current.length > 0) {
        failureCountRef.current = 0;
        setFailureCount(0);
        syncNowRef.current();
      }
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (queueRef.current.length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      syncState,
      pendingCount,
      showBar,
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
      syncState,
      pendingCount,
      showBar,
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
