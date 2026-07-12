import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { Session } from "@/domain/types";

const COOKIE_NAME = "sirrelay_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  activeGroupId: string | null;
};

function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (≥16 chars) for API mode");
  }
  return new TextEncoder().encode(secret);
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: MAX_AGE_SEC,
};

export async function signSessionPayload(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    const activeGroupId =
      payload.activeGroupId === null || typeof payload.activeGroupId === "string"
        ? payload.activeGroupId
        : null;
    return { userId, activeGroupId };
  } catch {
    return null;
  }
}

export async function readSessionPayload(): Promise<SessionPayload | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export async function writeSessionPayload(payload: SessionPayload | null): Promise<void> {
  const jar = cookies();
  if (!payload) {
    jar.delete(COOKIE_NAME);
    return;
  }
  const token = await signSessionPayload(payload);
  jar.set(COOKIE_NAME, token, cookieOptions);
}

/** Type guard for hydrated session checks in API layer. */
export function isSession(value: Session | null): value is Session {
  return value != null;
}
