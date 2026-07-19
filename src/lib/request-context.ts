import { AsyncLocalStorage } from "node:async_hooks";

/** Standard correlation header (P2-MON-01). */
export const REQUEST_ID_HEADER = "x-request-id";

type RequestContext = { requestId: string };

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return storage.run({ requestId }, fn);
}

/** Prefer inbound header; otherwise mint a new id. */
export function resolveRequestId(headerValue: string | null): string {
  const trimmed = headerValue?.trim();
  if (trimmed && trimmed.length <= 128 && /^[\w\-.:]+$/.test(trimmed)) {
    return trimmed;
  }
  return crypto.randomUUID();
}
