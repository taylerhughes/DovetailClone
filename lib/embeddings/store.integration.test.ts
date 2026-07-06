import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  replaceChunksForSubject,
  deleteChunksForSubject,
  similaritySearch,
} from "./store";

/**
 * Exercises lib/embeddings/store.ts against a real Postgres database. All of
 * this module's logic is raw SQL (EmbeddingChunk.embedding is an
 * Unsupported("vector(1024)") column invisible to the typed Prisma Client),
 * so this is the only way to verify it actually behaves as designed. No real
 * Voyage network calls -- vectors are hand-crafted synthetic values.
 */
describe("embeddings store", () => {
  let userId: string;
  let projectA: string;
  let projectB: string;

  function vec(first: number, second: number, dims = 1024): number[] {
    const arr = new Array(dims).fill(0);
    arr[0] = first;
    arr[1] = second;
    return arr;
  }

  beforeAll(async () => {
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Embeddings Store Test User",
        email: `embeddings-store-test-${randomUUID()}@example.com`,
      },
    });
    userId = user.id;

    const [pa, pb] = await Promise.all([
      db.project.create({ data: { name: "Embeddings Store Project A", userId } }),
      db.project.create({ data: { name: "Embeddings Store Project B", userId } }),
    ]);
    projectA = pa.id;
    projectB = pb.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: userId } });
  });

  it("replaceChunksForSubject stores chunks readable via similaritySearch, scoped by project", async () => {
    await replaceChunksForSubject("HIGHLIGHT", "store-test-h1", projectA, [
      { text: "users got lost in settings", embedding: vec(0.9, 0.1) },
    ]);
    await replaceChunksForSubject("HIGHLIGHT", "store-test-h2", projectA, [
      { text: "checkout was smooth", embedding: vec(0.1, 0.9) },
    ]);
    await replaceChunksForSubject("HIGHLIGHT", "store-test-h3", projectB, [
      { text: "very similar to settings query", embedding: vec(0.95, 0.05) },
    ]);

    const rows = await similaritySearch({
      queryEmbedding: vec(0.88, 0.12),
      accessibleProjectIds: [projectA],
      k: 5,
      subjectTypes: ["HIGHLIGHT"],
    });

    expect(rows.map((r) => r.subjectId)).toEqual(["store-test-h1", "store-test-h2"]);
    expect(rows.some((r) => r.subjectId === "store-test-h3")).toBe(false);
  });

  it("excludeSubjectIds filters out the given (type, id) pairs", async () => {
    const rows = await similaritySearch({
      queryEmbedding: vec(0.88, 0.12),
      accessibleProjectIds: [projectA],
      k: 5,
      subjectTypes: ["HIGHLIGHT"],
      excludeSubjectIds: [{ subjectType: "HIGHLIGHT", subjectId: "store-test-h1" }],
    });

    expect(rows.map((r) => r.subjectId)).toEqual(["store-test-h2"]);
  });

  it("replaceChunksForSubject fully replaces a subject's prior chunks", async () => {
    await replaceChunksForSubject("NOTE", "store-test-n1", projectA, [
      { text: "chunk one", embedding: vec(0.5, 0.5) },
      { text: "chunk two", embedding: vec(0.5, 0.5) },
    ]);
    let count = await db.embeddingChunk.count({
      where: { subjectType: "NOTE", subjectId: "store-test-n1" },
    });
    expect(count).toBe(2);

    await replaceChunksForSubject("NOTE", "store-test-n1", projectA, [
      { text: "single replacement chunk", embedding: vec(0.5, 0.5) },
    ]);
    count = await db.embeddingChunk.count({
      where: { subjectType: "NOTE", subjectId: "store-test-n1" },
    });
    expect(count).toBe(1);

    await deleteChunksForSubject("NOTE", "store-test-n1");
  });

  it("replaceChunksForSubject is atomic: a malformed chunk leaves the prior chunks untouched", async () => {
    await replaceChunksForSubject("NOTE", "store-test-n2", projectA, [
      { text: "original chunk", embedding: vec(0.5, 0.5) },
    ]);
    let count = await db.embeddingChunk.count({
      where: { subjectType: "NOTE", subjectId: "store-test-n2" },
    });
    expect(count).toBe(1);

    // A missing embedding (e.g. a partial provider response) makes
    // toVectorLiteral throw while building the query -- before the
    // transaction's DELETE ever runs.
    await expect(
      replaceChunksForSubject("NOTE", "store-test-n2", projectA, [
        { text: "bad chunk", embedding: undefined as unknown as number[] },
      ]),
    ).rejects.toThrow();

    count = await db.embeddingChunk.count({
      where: { subjectType: "NOTE", subjectId: "store-test-n2" },
    });
    expect(count).toBe(1);

    await deleteChunksForSubject("NOTE", "store-test-n2");
  });

  it("similaritySearch returns [] when no projects are accessible", async () => {
    const rows = await similaritySearch({
      queryEmbedding: vec(0.5, 0.5),
      accessibleProjectIds: [],
      k: 5,
    });
    expect(rows).toEqual([]);
  });

  afterAll(async () => {
    await deleteChunksForSubject("HIGHLIGHT", "store-test-h1");
    await deleteChunksForSubject("HIGHLIGHT", "store-test-h2");
    await deleteChunksForSubject("HIGHLIGHT", "store-test-h3");
  });
});
