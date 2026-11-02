function parseMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Delay before replaying the mutation queue after a silent failure. */
export const syncRetryMs = parseMs(
  process.env.NEXT_PUBLIC_SYNC_RETRY_INTERVAL_MS,
  10_000,
);
