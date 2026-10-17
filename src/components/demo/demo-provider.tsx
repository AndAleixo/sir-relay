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
import type { MutationInput } from "@/domain/sync";
import { SyncContext, type SyncContextValue } from "@/components/sync/sync-provider";
import type { ProjectsLocalApi } from "@/components/projects/projects-manager";
import {
  createDemoWorkspace,
  type DemoPreset,
  demoAddCategory,
  demoAddMember,
  demoArchiveProject,
  demoCloneTask,
  demoCreateProject,
  demoCreateTask,
  demoDeleteTask,
  demoPatchTask,
  demoPlaceInTodoQueue,
  demoRemoveCategory,
  readDemoWorkspace,
  writeDemoWorkspace,
  type DemoWorkspace,
} from "@/lib/demo-workspace";

type DemoContextValue = {
  ready: boolean;
  workspace: DemoWorkspace | null;
  start: (name: string, preset: DemoPreset) => boolean;
  leave: () => void;
  addMember: (name: string) => boolean;
  createTask: (input: Parameters<typeof demoCreateTask>[1]) => boolean;
  projects: ProjectsLocalApi;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function useDemoContext(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider missing");
  return value;
}

export function useDemoWorkspace(): DemoWorkspace | null {
  return useDemoContext().workspace;
}

export function useDemoReady(): boolean {
  return useDemoContext().ready;
}

export function useDemoActions() {
  const { start, leave, addMember, createTask, projects } = useDemoContext();
  return { start, leave, addMember, createTask, projects };
}

export function DemoProvider({
  children,
  fresh = false,
}: {
  children: ReactNode;
  /** Name gate: drop any demo already stored in this tab. */
  fresh?: boolean;
}) {
  const [workspace, setWorkspace] = useState<DemoWorkspace | null>(null);
  const [ready, setReady] = useState(false);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  useEffect(() => {
    if (fresh) writeDemoWorkspace(null);
    setWorkspace(fresh ? null : readDemoWorkspace());
    setReady(true);
  }, [fresh]);

  const commit = useCallback((next: DemoWorkspace | null) => {
    workspaceRef.current = next;
    writeDemoWorkspace(next);
    setWorkspace(next);
  }, []);

  const update = useCallback(
    (recipe: (current: DemoWorkspace) => DemoWorkspace) => {
      const current = workspaceRef.current;
      if (!current) return;
      commit(recipe(current));
    },
    [commit],
  );

  const start = useCallback(
    (name: string, preset: DemoPreset) => {
      try {
        commit(createDemoWorkspace(name, preset));
        return true;
      } catch {
        return false;
      }
    },
    [commit],
  );

  const leave = useCallback(() => {
    commit(null);
  }, [commit]);

  const addMember = useCallback(
    (name: string) => {
      const current = workspaceRef.current;
      if (!current) return false;
      const next = demoAddMember(current, name);
      if (!next) return false;
      commit(next);
      return true;
    },
    [commit],
  );

  const createTask = useCallback((input: Parameters<typeof demoCreateTask>[1]) => {
    const current = workspaceRef.current;
    if (!current) return false;
    const next = demoCreateTask(current, input);
    if (next === current) return false;
    commit(next);
    return true;
  }, [commit]);

  const projects = useMemo<ProjectsLocalApi>(
    () => ({
      create: (input) => {
        const current = workspaceRef.current;
        if (!current) return "name";
        const result = demoCreateProject(current, input);
        if (result.error) return result.error;
        commit(result.workspace);
        return null;
      },
      archive: (projectId) => update((current) => demoArchiveProject(current, projectId)),
      addCategory: (projectId, name) => {
        const current = workspaceRef.current;
        if (!current) return "name";
        const result = demoAddCategory(current, projectId, name);
        if (result.error) return result.error;
        commit(result.workspace);
        return null;
      },
      removeCategory: (categoryId) =>
        update((current) => demoRemoveCategory(current, categoryId)),
    }),
    [commit, update],
  );

  const applyTaskUpdate = useCallback(
    async (taskId: string, patch: Partial<Task>, mutationInputs: MutationInput[]) => {
      if (mutationInputs.length === 0) return;
      update((current) => demoPatchTask(current, taskId, patch));
    },
    [update],
  );

  const createTaskQuick = useCallback(
    async (
      _locale: string,
      input: {
        title: string;
        assigneeId: string;
        assigneeName: string;
        projectId?: string | null;
        projectAcronym?: string | null;
      },
    ) => {
      const before = workspaceRef.current?.tasks.length ?? 0;
      update((current) => demoCreateTask(current, input));
      return (workspaceRef.current?.tasks.length ?? 0) > before;
    },
    [update],
  );

  const cloneTask = useCallback(
    async (taskId: string) => {
      const before = workspaceRef.current?.tasks.length ?? 0;
      update((current) => demoCloneTask(current, taskId));
      return (workspaceRef.current?.tasks.length ?? 0) > before;
    },
    [update],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      update((current) => demoDeleteTask(current, taskId));
      return true;
    },
    [update],
  );

  const placeInTodoQueue = useCallback(
    async (taskId: string, assigneeId: string, orderedTodoIds: string[]) => {
      update((current) =>
        demoPlaceInTodoQueue(current, taskId, assigneeId, orderedTodoIds),
      );
      return true;
    },
    [update],
  );

  const noop = useCallback(async () => {}, []);

  const tasks = workspace?.tasks ?? [];

  const syncValue = useMemo<SyncContextValue>(
    () => ({
      tasks,
      syncState: "synced",
      pendingCount: 0,
      showBar: false,
      conflicts: [],
      syncFromServer: noop,
      applyTaskUpdate,
      createTaskQuick,
      cloneTask,
      deleteTask,
      placeInTodoQueue,
      syncNow: noop,
      resolveConflict: noop,
    }),
    [
      tasks,
      applyTaskUpdate,
      createTaskQuick,
      cloneTask,
      deleteTask,
      placeInTodoQueue,
      noop,
    ],
  );

  const demoValue = useMemo<DemoContextValue>(
    () => ({ ready, workspace, start, leave, addMember, createTask, projects }),
    [ready, workspace, start, leave, addMember, createTask, projects],
  );

  return (
    <DemoContext.Provider value={demoValue}>
      <SyncContext.Provider value={syncValue}>{children}</SyncContext.Provider>
    </DemoContext.Provider>
  );
}
