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
import {
  clearDemoTutorialState,
  defaultTutorialState,
  readDemoTutorialState,
  TUTORIAL_STEP_ACTIONS,
  writeDemoTutorialState,
  type DemoTutorialState,
  type TutorialActionKind,
} from "@/lib/demo-tutorial";

type DemoTutorialApi = {
  step: number;
  showSteps: boolean;
  showFinish: boolean;
  skipTutorial: () => void;
  finishTutorial: () => void;
  reportTutorialAction: (kind: TutorialActionKind) => void;
};

type DemoContextValue = {
  ready: boolean;
  workspace: DemoWorkspace | null;
  start: (name: string, preset: DemoPreset) => boolean;
  leave: () => void;
  addMember: (name: string) => boolean;
  createTask: (input: Parameters<typeof demoCreateTask>[1]) => boolean;
  projects: ProjectsLocalApi;
  tutorial: DemoTutorialApi;
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

export function useDemoTutorial(): DemoTutorialApi {
  return useDemoContext().tutorial;
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
  const [tutorialState, setTutorialState] = useState<DemoTutorialState>(
    defaultTutorialState,
  );
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  useEffect(() => {
    if (fresh) {
      writeDemoWorkspace(null);
      clearDemoTutorialState();
      setTutorialState(defaultTutorialState());
    } else {
      setWorkspace(readDemoWorkspace());
      setTutorialState(readDemoTutorialState());
    }
    setReady(true);
  }, [fresh]);

  const applyTutorialKinds = useCallback((kinds: TutorialActionKind[]) => {
    setTutorialState((prev) => {
      if (prev.skipped || prev.finished) return prev;
      let step = prev.step;
      for (const kind of kinds) {
        if (step > 5) break;
        if (TUTORIAL_STEP_ACTIONS[step] === kind) step += 1;
      }
      if (step === prev.step) return prev;
      const next: DemoTutorialState = { ...prev, step };
      writeDemoTutorialState(next);
      return next;
    });
  }, []);

  const reportTutorialAction = useCallback(
    (kind: TutorialActionKind) => applyTutorialKinds([kind]),
    [applyTutorialKinds],
  );

  const skipTutorial = useCallback(() => {
    setTutorialState((prev) => {
      const next: DemoTutorialState = {
        ...prev,
        skipped: true,
        finished: true,
      };
      writeDemoTutorialState(next);
      return next;
    });
  }, []);

  const finishTutorial = useCallback(() => {
    setTutorialState((prev) => {
      const next: DemoTutorialState = { ...prev, finished: true };
      writeDemoTutorialState(next);
      return next;
    });
  }, []);

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
        const next = defaultTutorialState();
        clearDemoTutorialState();
        writeDemoTutorialState(next);
        setTutorialState(next);
        commit(createDemoWorkspace(name, preset));
        return true;
      } catch {
        return false;
      }
    },
    [commit],
  );

  const leave = useCallback(() => {
    clearDemoTutorialState();
    setTutorialState(defaultTutorialState());
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

  const createTask = useCallback(
    (input: Parameters<typeof demoCreateTask>[1]) => {
      const current = workspaceRef.current;
      if (!current) return false;
      const next = demoCreateTask(current, input);
      if (next === current) return false;
      commit(next);
      applyTutorialKinds(
        input.assigneeId !== current.selfId
          ? ["create_task", "assign_task"]
          : ["create_task"],
      );
      return true;
    },
    [applyTutorialKinds, commit],
  );

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
      const current = workspaceRef.current;
      const before = current?.tasks.find((row) => row.id === taskId);
      update((ws) => demoPatchTask(ws, taskId, patch));
      if (!before) return;
      if (
        patch.assigneeId &&
        patch.assigneeId !== before.assigneeId
      ) {
        reportTutorialAction("assign_task");
      }
      if (patch.status === "doing" && before.status !== "doing") {
        reportTutorialAction("start_task");
      }
      if (patch.status === "done" && before.status !== "done") {
        reportTutorialAction("complete_task");
      }
    },
    [reportTutorialAction, update],
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
      const current = workspaceRef.current;
      if (!current) return false;
      const before = current.tasks.length;
      update((ws) => demoCreateTask(ws, input));
      const after = workspaceRef.current?.tasks.length ?? 0;
      if (after <= before) return false;
      applyTutorialKinds(
        input.assigneeId !== current.selfId
          ? ["create_task", "assign_task"]
          : ["create_task"],
      );
      return true;
    },
    [applyTutorialKinds, update],
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
      const current = workspaceRef.current;
      const before = current?.tasks.find((row) => row.id === taskId);
      update((ws) =>
        demoPlaceInTodoQueue(ws, taskId, assigneeId, orderedTodoIds),
      );
      if (before && before.assigneeId !== assigneeId) {
        reportTutorialAction("assign_task");
      }
      return true;
    },
    [reportTutorialAction, update],
  );

  const noop = useCallback(async () => {}, []);

  const tasks = workspace?.tasks ?? [];

  const syncValue = useMemo<SyncContextValue>(
    () => ({
      tasks,
      pendingCount: 0,
      showBar: false,
      busy: false,
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

  const tutorial = useMemo<DemoTutorialApi>(
    () => ({
      step: tutorialState.step,
      showSteps:
        Boolean(workspace) &&
        !tutorialState.skipped &&
        !tutorialState.finished &&
        tutorialState.step <= 5,
      showFinish:
        Boolean(workspace) &&
        !tutorialState.skipped &&
        !tutorialState.finished &&
        tutorialState.step === 6,
      skipTutorial,
      finishTutorial,
      reportTutorialAction,
    }),
    [
      finishTutorial,
      reportTutorialAction,
      skipTutorial,
      tutorialState.finished,
      tutorialState.skipped,
      tutorialState.step,
      workspace,
    ],
  );

  const demoValue = useMemo<DemoContextValue>(
    () => ({
      ready,
      workspace,
      start,
      leave,
      addMember,
      createTask,
      projects,
      tutorial,
    }),
    [ready, workspace, start, leave, addMember, createTask, projects, tutorial],
  );

  return (
    <DemoContext.Provider value={demoValue}>
      <SyncContext.Provider value={syncValue}>{children}</SyncContext.Provider>
    </DemoContext.Provider>
  );
}
