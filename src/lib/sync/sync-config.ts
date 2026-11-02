function parseMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCount(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

/**
 * Silent network retries before the top bar.
 * 3 = gesture attempt + 2 quiet replays; bar on the 3rd consecutive failure.
 */
export const syncRetryConfig = {
  failuresBeforeBar: parseCount(
    process.env.NEXT_PUBLIC_SYNC_FAILURES_BEFORE_BAR,
    3,
  ),
  /** Delay between quiet retries (connection blips). */
  silentRetryMs: parseMs(
    process.env.NEXT_PUBLIC_SYNC_RETRY_SILENT_MS,
    2_000,
  ),
  /** Delay once the bar is visible. */
  retryMs: parseMs(process.env.NEXT_PUBLIC_SYNC_RETRY_INTERVAL_MS, 10_000),
};

export function syncRetryDelayMs(failureCount: number): number {
  return failureCount >= syncRetryConfig.failuresBeforeBar
    ? syncRetryConfig.retryMs
    : syncRetryConfig.silentRetryMs;
}

/** Bar after silent retries exhausted, or immediately on conflict. */
export function shouldShowSyncBar(input: {
  pendingCount: number;
  failureCount: number;
  conflictCount: number;
}): boolean {
  if (input.conflictCount > 0) return true;
  return (
    input.pendingCount > 0 &&
    input.failureCount >= syncRetryConfig.failuresBeforeBar
  );
}
