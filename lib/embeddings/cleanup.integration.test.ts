import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  deleteEmbeddingsForNote,
  deleteEmbeddingsForHighlight,
  deleteEmbeddingsForInsight,
} from "./cleanup";
import { replaceChunksForSubject } from "./store";

/**
 * EmbeddingChunk.subjectId is polymorphic with no FK (same limitation as
 * CanvasCardPosition), so cleanup on delete is application logic, not a
 * Prisma-level cascade -- this exercises that logic against real Postgres.
 */
describe("embeddings cleanup", () => {
  let userId: string;
  let projectId: string;

  function vec(): number[] {
    return new Array(1024).fill(0.1);
  }

  beforeAll(async () => {
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        name: "Embeddings Cleanup Test User",
        email: `embeddings-cleanup-test-${randomUUID()}@example.com`,
      },
    });
    userId = user.id;
    const project = await db.project.create({
      data: { name: "Embeddings Cleanup Project", userId },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: userId } });
  });

  it("deleteEmbeddingsForNote removes the note's own chunk and its highlights' chunks", async () => {
    const note = await db.note.create({
      data: { projectId, title: "Cleanup note", content: { type: "doc", content: [] } },
    });
    const highlight = await db.highlight.create({
      data: { noteId: note.id, quote: "some quote", wholeNote: true },
    });

    await replaceChunksForSubject("NOTE", note.id, projectId, [
      { text: "note chunk", embedding: vec() },
    ]);
    await replaceChunksForSubject("HIGHLIGHT", highlight.id, projectId, [
      { text: "highlight chunk", embedding: vec() },
    ]);

    await deleteEmbeddingsForNote(note.id);

    const [noteChunks, highlightChunks] = await Promise.all([
      db.embeddingChunk.count({ where: { subjectType: "NOTE", subjectId: note.id } }),
      db.embeddingChunk.count({ where: { subjectType: "HIGHLIGHT", subjectId: highlight.id } }),
    ]);
    expect(noteChunks).toBe(0);
    expect(highlightChunks).toBe(0);

    await db.note.delete({ where: { id: note.id } });
  });

  it("deleteEmbeddingsForHighlight removes just that highlight's chunk", async () => {
    await replaceChunksForSubject("HIGHLIGHT", "cleanup-h1", projectId, [
      { text: "chunk", embedding: vec() },
    ]);
    await deleteEmbeddingsForHighlight("cleanup-h1");
    const count = await db.embeddingChunk.count({
      where: { subjectType: "HIGHLIGHT", subjectId: "cleanup-h1" },
    });
    expect(count).toBe(0);
  });

  it("deleteEmbeddingsForInsight removes just that insight's chunk", async () => {
    await replaceChunksForSubject("INSIGHT", "cleanup-i1", projectId, [
      { text: "chunk", embedding: vec() },
    ]);
    await deleteEmbeddingsForInsight("cleanup-i1");
    const count = await db.embeddingChunk.count({
      where: { subjectType: "INSIGHT", subjectId: "cleanup-i1" },
    });
    expect(count).toBe(0);
  });
});
