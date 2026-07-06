import { db } from "@/lib/db";
import { extractHighlightMarks } from "@/lib/editor/extractIds";
import type { JSONContent } from "@tiptap/react";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Reconciles Highlight rows against the highlight marks actually present in a
 * note's Tiptap doc: creates rows for marks with no corresponding row (e.g.
 * pasted content), refreshes quotes for existing ones, and orphans rows whose
 * mark was removed from the doc (without deleting them, to preserve any tags
 * or insight embeds already attached).
 *
 * Returns the ids of highlights actually created or updated (quote changed or
 * un-orphaned) -- not orphaned rows, whose quote is unchanged -- so callers
 * can re-embed only what changed rather than the note's entire highlight set.
 *
 * Deliberately NOT in a "use server" actions file: every export of such a file
 * becomes an individually invokable server action regardless of whether any
 * client code references it, and this helper is called from
 * actions/transcription.ts's detached background job, which has no user
 * session to check. Its callers (actions/notes.ts#updateNoteContent,
 * actions/transcription.ts#processTranscription) are themselves the
 * authorization boundary.
 */
export async function syncHighlightsForNote(
  noteId: string,
  doc: JSONContent,
): Promise<string[]> {
  const [marks, existing] = await Promise.all([
    Promise.resolve(extractHighlightMarks(doc)),
    db.highlight.findMany({ where: { noteId, wholeNote: false } }),
  ]);

  const markIds = new Set(marks.map((m) => m.markId));
  const existingByMarkId = new Map(
    existing.filter((h) => h.markId).map((h) => [h.markId as string, h]),
  );

  const ops: Prisma.PrismaPromise<{ id: string }>[] = [];
  let nextOrder = existing.length;

  for (const { markId, quote } of marks) {
    const row = existingByMarkId.get(markId);
    if (!row) {
      ops.push(
        db.highlight.create({
          data: { noteId, markId, quote, order: nextOrder++ },
          select: { id: true },
        }),
      );
    } else if (row.quote !== quote || row.orphaned) {
      ops.push(
        db.highlight.update({
          where: { id: row.id },
          data: { quote, orphaned: false },
          select: { id: true },
        }),
      );
    }
  }

  for (const row of existing) {
    if (row.markId && !markIds.has(row.markId) && !row.orphaned) {
      ops.push(
        db.highlight.update({
          where: { id: row.id },
          data: { orphaned: true },
          select: { id: true },
        }),
      );
    }
  }

  if (ops.length === 0) return [];

  const results = await db.$transaction(ops);
  const orphanedIds = new Set(
    existing
      .filter((row) => row.markId && !markIds.has(row.markId) && !row.orphaned)
      .map((row) => row.id),
  );
  return results.map((r) => r.id).filter((id) => !orphanedIds.has(id));
}
