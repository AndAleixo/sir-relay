import { cookies } from "next/headers";
import { safeVsCodeNext } from "@/lib/vscode-next";

const COOKIE = "sirrelay_vscode_next";

const options = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60,
};

/** Keep the editor return path across the email confirmation hop. */
export async function rememberVsCodeNext(
  locale: string,
  raw: string | null,
): Promise<void> {
  const path = safeVsCodeNext(locale, raw);
  const jar = await cookies();
  if (!path) {
    jar.delete(COOKIE);
    return;
  }
  jar.set(COOKIE, path, options);
}

export async function consumeVsCodeNext(locale: string): Promise<string | null> {
  const jar = await cookies();
  const path = safeVsCodeNext(locale, jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
  return path;
}
