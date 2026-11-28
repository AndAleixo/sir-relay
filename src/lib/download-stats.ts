import { unstable_cache } from "next/cache";

/** Floor-known fallbacks (never inflate). Update when live floors rise. */
export const OPEN_VSX_FALLBACK = 1200;
export const NPM_MCP_FALLBACK = 800;

const MIN_DISPLAY = 100;

const OPEN_VSX_API = "https://open-vsx.org/api/sirrelay/sirrelay";
const NPM_DOWNLOADS_API =
  "https://api.npmjs.org/downloads/point/last-year/@sirrelay/mcp";

export type DownloadStat = {
  count: number;
  /** Locale-aware display like "1,200+" / "1.200+"; null if below threshold. */
  label: string | null;
  href: string;
};

export type DownloadStats = {
  extension: DownloadStat;
  mcp: DownloadStat;
};

/** Round down to nearest hundred; hide below MIN_DISPLAY. */
export function formatDownloadFloor(
  count: number,
  locale: string,
): string | null {
  if (!Number.isFinite(count) || count < MIN_DISPLAY) return null;
  const floored = Math.floor(count / 100) * 100;
  if (floored < MIN_DISPLAY) return null;
  const formatted = new Intl.NumberFormat(locale).format(floored);
  return `${formatted}+`;
}

async function fetchOpenVsxCount(): Promise<number> {
  try {
    const res = await fetch(OPEN_VSX_API, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return OPEN_VSX_FALLBACK;
    const data = (await res.json()) as { downloadCount?: unknown };
    const n =
      typeof data.downloadCount === "number" ? data.downloadCount : NaN;
    if (!Number.isFinite(n) || n < 0) return OPEN_VSX_FALLBACK;
    // Never show above live; fallback only when fetch fails.
    return Math.max(0, Math.floor(n));
  } catch {
    return OPEN_VSX_FALLBACK;
  }
}

async function fetchNpmMcpCount(): Promise<number> {
  try {
    const res = await fetch(NPM_DOWNLOADS_API, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NPM_MCP_FALLBACK;
    const data = (await res.json()) as { downloads?: unknown };
    const n = typeof data.downloads === "number" ? data.downloads : NaN;
    if (!Number.isFinite(n) || n < 0) return NPM_MCP_FALLBACK;
    return Math.max(0, Math.floor(n));
  } catch {
    return NPM_MCP_FALLBACK;
  }
}

const getCachedCounts = unstable_cache(
  async () => {
    const [extension, mcp] = await Promise.all([
      fetchOpenVsxCount(),
      fetchNpmMcpCount(),
    ]);
    return { extension, mcp };
  },
  ["download-stats-v1"],
  { revalidate: 86400 },
);

export async function getDownloadStats(locale: string): Promise<DownloadStats> {
  const counts = await getCachedCounts();
  return {
    extension: {
      count: counts.extension,
      label: formatDownloadFloor(counts.extension, locale),
      href: "https://open-vsx.org/extension/sirrelay/sirrelay",
    },
    mcp: {
      count: counts.mcp,
      label: formatDownloadFloor(counts.mcp, locale),
      href: "https://www.npmjs.com/package/@sirrelay/mcp",
    },
  };
}
