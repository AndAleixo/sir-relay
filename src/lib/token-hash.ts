import { createHash, randomBytes } from "crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(prefix: string): string {
  return `${prefix}-${randomBytes(12).toString("base64url")}`;
}
