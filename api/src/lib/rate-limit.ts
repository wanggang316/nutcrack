/**
 * Simple in-memory IP-keyed token bucket. Each key may make at most one
 * request per `windowMs` window. State is process-local; for multi-process
 * deployments this should be replaced with a shared store.
 */

export type RateLimitResult = { allowed: boolean; retryAfterMs?: number };

const DEFAULT_WINDOW_MS = 60_000;
const MAX_ENTRIES = 10_000;

const lastAllowedAt = new Map<string, number>();

function pruneIfFull(now: number, windowMs: number): void {
  if (lastAllowedAt.size <= MAX_ENTRIES) return;
  const cutoff = now - windowMs * 10;
  for (const [key, ts] of lastAllowedAt) {
    if (ts < cutoff) {
      lastAllowedAt.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const last = lastAllowedAt.get(key);

  if (last === undefined || now - last >= windowMs) {
    lastAllowedAt.set(key, now);
    pruneIfFull(now, windowMs);
    return { allowed: true };
  }

  return { allowed: false, retryAfterMs: windowMs - (now - last) };
}

/**
 * Test-only helper. Clears the in-memory state so each test starts with a
 * fresh limiter. Not exported as part of the public API surface.
 */
export function resetRateLimit(): void {
  lastAllowedAt.clear();
}
