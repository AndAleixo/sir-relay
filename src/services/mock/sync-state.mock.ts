import type { Task } from "@/domain/types";

const appliedMutations = new Map<string, Task>();

export function getAppliedMutation(clientMutationId: string): Task | undefined {
  return appliedMutations.get(clientMutationId);
}

export function recordAppliedMutation(clientMutationId: string, task: Task) {
  appliedMutations.set(clientMutationId, task);
}
