const SCHEMES = new Set(["vscode", "cursor"]);

/** Only the VS Code connect page may be used as a post-login return path. */
export function safeVsCodeNext(locale: string, raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, "http://local");
  } catch {
    return null;
  }
  if (url.origin !== "http://local") return null;
  if (url.pathname !== `/${locale}/vscode/connect`) return null;
  const scheme = url.searchParams.get("scheme");
  if (scheme && !SCHEMES.has(scheme)) return null;
  return `${url.pathname}${url.search}`;
}

/** Keep a safe connect return path on login and signup links. */
export function withVsCodeNext(path: string, returnTo: string | null | undefined): string {
  if (!returnTo) return path;
  const locale = path.split("/").filter(Boolean)[0] ?? "";
  const safe = safeVsCodeNext(locale, returnTo);
  if (!safe) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}next=${encodeURIComponent(safe)}`;
}

export function vsCodeScheme(raw: string | null | undefined): "vscode" | "cursor" {
  return raw === "cursor" ? "cursor" : "vscode";
}
