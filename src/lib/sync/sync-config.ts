const FAILURES_BEFORE_BAR = 2;

function parseMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const syncRetryConfig = {
  failuresBeforeBar: FAILURES_BEFORE_BAR,
  initialRetryMs: parseMs(
    process.env.NEXT_PUBLIC_SYNC_RETRY_INITIAL_MS,
    3000,
  ),
  intervalRetryMs: parseMs(
    process.env.NEXT_PUBLIC_SYNC_RETRY_INTERVAL_MS,
    10000,
  ),
};

export function syncRetryDelayMs(failureCount: number): number {
  return failureCount >= syncRetryConfig.failuresBeforeBar
    ? syncRetryConfig.intervalRetryMs
    : syncRetryConfig.initialRetryMs;
}
