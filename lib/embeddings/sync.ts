import { db } from "@/lib/db";
import { chunkPlainText } from "./chunking";
import { embedTexts } from "./embed";
import { replaceChunksForSubject, deleteChunksForSubject } from "./store";
import { isEmbeddingsEnabled } from "./client";

/**
 * Fire-and-forget re-embedding, matching the detached-background-task
 * convention used by processTranscription/processHighlightReel: callers do
 * `void syncXEmbeddings(...)` after their own mutation + revalidatePath, never
 * awaited, and every function here fails closed (catches, logs, never
 * throws) -- a note/highlight/insight that fails to embed just doesn't
 * surface in chat/theme/conflict retrieval, an acceptable soft-fail for a
 * recall-enhancing feature with no dedicated retry UI in v1.
 */

export async function syncNoteEmbeddings(noteId: string): Promise<void> {
  if (!isEmbeddingsEnabled()) return;
  try {
    const note = await db.note.findUnique({
      where: { id: noteId },
      select: { projectId: true, plainText: true },
    });
    if (!note) return;

    const chunks = chunkPlainText(note.plainText);
    if (chunks.length === 0) {
      await deleteChunksForSubject("NOTE", noteId);
      return;
    }

    const embeddings = await embedTexts(chunks, "document");
    await replaceChunksForSubject(
      "NOTE",
      noteId,
      note.projectId,
      chunks.map((text, i) => ({ text, embedding: embeddings[i] })),
    );
  } catch (err) {
    console.error("syncNoteEmbeddings failed", err);
  }
}

export async function syncHighlightEmbeddings(highlightIds: string[]): Promise<void> {
  if (!isEmbeddingsEnabled() || highlightIds.length === 0) return;
  try {
    const highlights = await db.highlight.findMany({
      where: { id: { in: highlightIds } },
      select: { id: true, quote: true, note: { select: { projectId: true } } },
    });

    const nonEmpty = highlights.filter((h) => h.quote.trim());
    const embeddings = await embedTexts(
      nonEmpty.map((h) => h.quote),
      "document",
    );

    await Promise.all(
      highlights.map(async (h) => {
        if (!h.quote.trim()) {
          await deleteChunksForSubject("HIGHLIGHT", h.id);
          return;
        }
        const index = nonEmpty.findIndex((n) => n.id === h.id);
        await replaceChunksForSubject("HIGHLIGHT", h.id, h.note.projectId, [
          { text: h.quote, embedding: embeddings[index] },
        ]);
      }),
    );
  } catch (err) {
    console.error("syncHighlightEmbeddings failed", err);
  }
}

export async function syncInsightEmbeddings(insightId: string): Promise<void> {
  if (!isEmbeddingsEnabled()) return;
  try {
    const insight = await db.insight.findUnique({
      where: { id: insightId },
      select: { projectId: true, plainText: true },
    });
    if (!insight) return;

    const chunks = chunkPlainText(insight.plainText);
    if (chunks.length === 0) {
      await deleteChunksForSubject("INSIGHT", insightId);
      return;
    }

    const embeddings = await embedTexts(chunks, "document");
    await replaceChunksForSubject(
      "INSIGHT",
      insightId,
      insight.projectId,
      chunks.map((text, i) => ({ text, embedding: embeddings[i] })),
    );
  } catch (err) {
    console.error("syncInsightEmbeddings failed", err);
  }
}
