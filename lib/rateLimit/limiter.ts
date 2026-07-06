import { db } from "@/lib/db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * Fixed-window rate limiter backed by RateLimitBucket. A single atomic
 * upsert both records the request and returns the resulting count, so
 * concurrent requests for the same key can't race past the limit.
 */
export async function checkRateLimit(
  key: string,
  { max, windowSec }: { max: number; windowSec: number },
): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = windowSec * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."windowStart" = EXCLUDED."windowStart"
        THEN "RateLimitBucket"."count" + 1
        ELSE 1
      END,
      "windowStart" = EXCLUDED."windowStart"
    RETURNING "count"
  `;

  const count = rows[0].count;
  const windowEndMs = windowStart.getTime() + windowMs;
  const retryAfterSec = Math.max(0, Math.ceil((windowEndMs - now.getTime()) / 1000));

  return { allowed: count <= max, retryAfterSec };
}
