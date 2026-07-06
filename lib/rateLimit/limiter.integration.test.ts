import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { checkRateLimit } from "./limiter";

describe("checkRateLimit", () => {
  const keys: string[] = [];

  function testKey(): string {
    const key = `test:${randomUUID()}`;
    keys.push(key);
    return key;
  }

  afterEach(async () => {
    await db.rateLimitBucket.deleteMany({ where: { key: { in: keys } } });
    keys.length = 0;
  });

  it("allows requests up to the max within a window", async () => {
    const key = testKey();
    for (let i = 1; i <= 3; i++) {
      const result = await checkRateLimit(key, { max: 3, windowSec: 60 });
      expect(result.allowed).toBe(true);
    }
  });

  it("denies requests once the max is exceeded within the window", async () => {
    const key = testKey();
    await checkRateLimit(key, { max: 2, windowSec: 60 });
    await checkRateLimit(key, { max: 2, windowSec: 60 });
    const third = await checkRateLimit(key, { max: 2, windowSec: 60 });
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", async () => {
    const keyA = testKey();
    const keyB = testKey();
    await checkRateLimit(keyA, { max: 1, windowSec: 60 });
    const secondForA = await checkRateLimit(keyA, { max: 1, windowSec: 60 });
    const firstForB = await checkRateLimit(keyB, { max: 1, windowSec: 60 });

    expect(secondForA.allowed).toBe(false);
    expect(firstForB.allowed).toBe(true);
  });

  it("resets the count once a new window starts", async () => {
    const key = testKey();
    // Simulate an existing bucket from a past window by writing directly.
    await db.rateLimitBucket.create({
      data: { key, windowStart: new Date(Date.now() - 120_000), count: 999 },
    });

    const result = await checkRateLimit(key, { max: 5, windowSec: 60 });
    expect(result.allowed).toBe(true);

    const row = await db.rateLimitBucket.findUniqueOrThrow({ where: { key } });
    expect(row.count).toBe(1);
  });

  it("does not race under concurrent requests for the same key", async () => {
    const key = testKey();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkRateLimit(key, { max: 5, windowSec: 60 })),
    );
    const allowedCount = results.filter((r) => r.allowed).length;
    expect(allowedCount).toBe(5);
  });
});
