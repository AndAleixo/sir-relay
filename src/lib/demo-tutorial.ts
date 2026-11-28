export const DEMO_TUTORIAL_STORAGE_KEY = "sirrelay-demo-tutorial";

export const TUTORIAL_STEP_TARGETS = [
  "demo-new-task",
  "demo-board",
  "demo-board",
  "demo-board",
  "demo-view-toggle",
  "demo-new-task-ai",
  "demo-compose-ai-review",
] as const;

export type TutorialActionKind =
  | "create_task"
  | "assign_task"
  | "start_task"
  | "complete_task"
  | "toggle_view"
  | "ai_suggest"
  | "ai_review";

export const TUTORIAL_STEP_ACTIONS: TutorialActionKind[] = [
  "create_task",
  "assign_task",
  "start_task",
  "complete_task",
  "toggle_view",
  "ai_suggest",
  "ai_review",
];

export type DemoTutorialState = {
  step: number;
  skipped: boolean;
  finished: boolean;
  /** Task assigned in step 2 — start must be this id. */
  focusTaskId: string | null;
};

export function defaultTutorialState(): DemoTutorialState {
  return { step: 0, skipped: false, finished: false, focusTaskId: null };
}

export function readDemoTutorialState(): DemoTutorialState {
  if (typeof sessionStorage === "undefined") return defaultTutorialState();
  try {
    const raw = sessionStorage.getItem(DEMO_TUTORIAL_STORAGE_KEY);
    if (!raw) return defaultTutorialState();
    const parsed = JSON.parse(raw) as Partial<DemoTutorialState>;
    return {
      step:
        typeof parsed.step === "number" && parsed.step >= 0 && parsed.step <= 7
          ? parsed.step
          : 0,
      skipped: Boolean(parsed.skipped),
      finished: Boolean(parsed.finished),
      focusTaskId:
        typeof parsed.focusTaskId === "string" ? parsed.focusTaskId : null,
    };
  } catch {
    return defaultTutorialState();
  }
}

export function writeDemoTutorialState(state: DemoTutorialState): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DEMO_TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ponytail: quota/private mode — in-memory step still works this session
  }
}

export function clearDemoTutorialState(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(DEMO_TUTORIAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
