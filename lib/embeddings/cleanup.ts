import { db } from "@/lib/db";
import { deleteChunksForSubject } from "./store";

/**
 * Explicit cleanup for the polymorphic, FK-less EmbeddingChunk.subjectId --
 * unlike the CanvasCardPosition precedent (which accepts dangling rows
 * silently), a dangling chunk here would actively resurface deleted content
 * in chat/conflict results, so every delete action calls the matching
 * cleanup helper alongside its own delete.
 */

export async function deleteEmbeddingsForNote(noteId: string): Promise<void> {
  const highlights = await db.highlight.findMany({
    where: { noteId },
    select: { id: true },
  });
  await Promise.all([
    deleteChunksForSubject("NOTE", noteId),
    ...highlights.map((h) => deleteChunksForSubject("HIGHLIGHT", h.id)),
  ]);
}

export async function deleteEmbeddingsForHighlight(highlightId: string): Promise<void> {
  await deleteChunksForSubject("HIGHLIGHT", highlightId);
}

export async function deleteEmbeddingsForInsight(insightId: string): Promise<void> {
  await deleteChunksForSubject("INSIGHT", insightId);
}
