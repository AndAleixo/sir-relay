/**
 * P2-SEC-11 — JSON logs with automatic redaction of secrets / bodies.
 * P2-MON-01 — attaches requestId from ALS or (async) request headers when present.
 * Does not log every request — only when callers already emit a line.
 */
import { headers } from "next/headers";
import { getRequestId, REQUEST_ID_HEADER } from "@/lib/request-context";

export type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY =
  /^(password|passwordhash|currentpassword|newpassword|confirmpassword|token|secret|authorization|cookie|set-cookie|session|sessionsecret|telegrambottoken|webhooksecret|body|comment|commentbody|messagetext|raw)$/i;

export function isSensitiveLogKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

/** Deep-clone-ish redact for log fields. */
export function redactForLog(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redactForLog);
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveLogKey(key) ? "[redacted]" : redactForLog(child);
  }
  return out;
}

function mergeRequestId(
  fields: Record<string, unknown>,
  requestId: string | undefined,
): Record<string, unknown> {
  if (!requestId || fields.requestId != null) return fields;
  return { requestId, ...fields };
}

export function logJson(
  level: LogLevel,
  msg: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(redactForLog(mergeRequestId(fields, getRequestId())) as Record<
      string,
      unknown
    >),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Same as logJson, but also reads `x-request-id` from Next headers
 * (proxy → app). Use in server actions / route handlers / services.
 */
export async function logJsonAsync(
  level: LogLevel,
  msg: string,
  fields: Record<string, unknown> = {},
): Promise<void> {
  let requestId = getRequestId();
  if (!requestId && fields.requestId == null) {
    try {
      requestId = (await headers()).get(REQUEST_ID_HEADER) ?? undefined;
    } catch {
      // Outside a request (scripts, webhook edge cases).
    }
  }
  logJson(level, msg, mergeRequestId(fields, requestId));
}
