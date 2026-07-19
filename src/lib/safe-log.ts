/**
 * P2-SEC-11 — JSON logs with automatic redaction of secrets / bodies.
 * Full request tracing (requestId on every hit) → P2-MON-01.
 */

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

export function logJson(
  level: LogLevel,
  msg: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(redactForLog(fields) as Record<string, unknown>),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
