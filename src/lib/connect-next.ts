const SCHEMES = new Set(["vscode", "cursor"]);

/** Only the connect page may be used as a post-login return path. */
export function safeConnectNext(locale: string, raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, "http://local");
  } catch {
    return null;
  }
  if (url.origin !== "http://local") return null;
  if (url.pathname !== `/${locale}/connect`) return null;
  const scheme = url.searchParams.get("scheme");
  if (scheme && !SCHEMES.has(scheme)) return null;
  return `${url.pathname}${url.search}`;
}

/** Keep a safe connect return path on login and signup links. */
export function withConnectNext(path: string, returnTo: string | null | undefined): string {
  if (!returnTo) return path;
  const locale = path.split("/").filter(Boolean)[0] ?? "";
  const safe = safeConnectNext(locale, returnTo);
  if (!safe) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}next=${encodeURIComponent(safe)}`;
}

/** Editor URI scheme for deep links (vscode:// / cursor://) — not the web path. */
export function editorUriScheme(raw: string | null | undefined): "vscode" | "cursor" {
  return raw === "cursor" ? "cursor" : "vscode";
}
