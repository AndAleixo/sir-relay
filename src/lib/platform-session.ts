/**
 * Separate ops session for `/platform` — not the product `sirrelay_session`.
 * Credentials: PLATFORM_ADMIN_USERNAME + PLATFORM_ADMIN_PASSWORD (env).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "sirrelay_platform_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h — shorter than product session

export type PlatformSession = {
  username: string;
};

function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (≥16 chars) for platform admin");
  }
  return new TextEncoder().encode(`platform:${secret}`);
}

function configuredCredentials(): { username: string; password: string } | null {
  const username = process.env.PLATFORM_ADMIN_USERNAME?.trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!username || !password || password.length < 8) return null;
  return { username, password };
}

/** Constant-time-ish compare of UTF-8 strings (hash first so lengths match). */
function secretsEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function platformAdminConfigured(): boolean {
  return configuredCredentials() != null;
}

export function verifyPlatformCredentials(
  username: string,
  password: string,
): boolean {
  const cfg = configuredCredentials();
  if (!cfg) return false;
  return secretsEqual(username.trim(), cfg.username) && secretsEqual(password, cfg.password);
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: MAX_AGE_SEC,
};

export async function readPlatformSession(): Promise<PlatformSession | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, sessionSecret());
    if (payload.kind !== "platform_admin") return null;
    if (typeof payload.username !== "string" || !payload.username) return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export async function writePlatformSession(
  session: PlatformSession | null,
): Promise<void> {
  const jar = cookies();
  if (!session) {
    jar.delete(COOKIE_NAME);
    return;
  }
  const token = await new SignJWT({
    kind: "platform_admin",
    username: session.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(sessionSecret());
  jar.set(COOKIE_NAME, token, cookieOptions);
}
