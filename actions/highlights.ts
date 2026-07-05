"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { extractHighlightMarks, stripHighlightMark } from "@/lib/editor/extractIds";
import { docToPlainText } from "@/lib/editor/plainText";
import type { JSONContent } from "@tiptap/react";
import type { Prisma } from "@/lib/generated/prisma/client";

async function revalidateHighlightPaths(projectId: string, noteId?: string) {
  revalidatePath(`/projects/${projectId}/highlights`);
  if (noteId) revalidatePath(`/projects/${projectId}/data/${noteId}`);
}

export async function createHighlight(
  noteId: string,
  markId: string,
  quote: string,
  clipRange?: { attachmentId: string; clipStartSec: number; clipEndSec: number },
) {
  const note = await db.note.findUniqueOrThrow({
    where: { id: noteId },
    select: { projectId: true },
  });

  const order = await db.highlight.count({ where: { noteId } });

  const highlight = await db.highlight.upsert({
    where: { noteId_markId: { noteId, markId } },
    create: { noteId, markId, quote, order, ...clipRange },
    update: { quote, orphaned: false, ...clipRange },
  });

  await revalidateHighlightPaths(note.projectId, noteId);
  return highlight;
}

export async function createWholeNoteHighlight(noteId: string) {
  const note = await db.note.findUniqueOrThrow({ where: { id: noteId } });

  const existing = await db.highlight.findFirst({
    where: { noteId, wholeNote: true },
  });
  if (existing) return existing;

  const order = await db.highlight.count({ where: { noteId } });
  const highlight = await db.highlight.create({
    data: {
      noteId,
      wholeNote: true,
      quote: note.plainText,
      order,
    },
  });

  await revalidateHighlightPaths(note.projectId, noteId);
  return highlight;
}

export async function deleteHighlight(highlightId: string) {
  const highlight = await db.highlight.findUniqueOrThrow({
    where: { id: highlightId },
    include: { note: { select: { id: true, projectId: true, content: true } } },
  });

  if (highlight.markId && !highlight.wholeNote) {
    const nextContent = stripHighlightMark(
      highlight.note.content as JSONContent,
      highlight.markId,
    );
    await db.note.update({
      where: { id: highlight.note.id },
      data: {
        content: nextContent as unknown as Prisma.InputJsonValue,
        plainText: docToPlainText(nextContent),
      },
    });
  }

  await db.highlight.delete({ where: { id: highlightId } });

  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}

/**
 * Reconciles Highlight rows against the highlight marks actually present in a
 * note's Tiptap doc: creates rows for marks with no corresponding row (e.g.
 * pasted content), refreshes quotes for existing ones, and orphans rows whose
 * mark was removed from the doc (without deleting them, to preserve any tags
 * or insight embeds already attached).
 */
export async function syncHighlightsForNote(noteId: string, doc: JSONContent) {
  const [marks, existing] = await Promise.all([
    Promise.resolve(extractHighlightMarks(doc)),
    db.highlight.findMany({ where: { noteId, wholeNote: false } }),
  ]);

  const markIds = new Set(marks.map((m) => m.markId));
  const existingByMarkId = new Map(
    existing.filter((h) => h.markId).map((h) => [h.markId as string, h]),
  );

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let nextOrder = existing.length;

  for (const { markId, quote } of marks) {
    const row = existingByMarkId.get(markId);
    if (!row) {
      ops.push(
        db.highlight.create({ data: { noteId, markId, quote, order: nextOrder++ } }),
      );
    } else if (row.quote !== quote || row.orphaned) {
      ops.push(
        db.highlight.update({
          where: { id: row.id },
          data: { quote, orphaned: false },
        }),
      );
    }
  }

  for (const row of existing) {
    if (row.markId && !markIds.has(row.markId) && !row.orphaned) {
      ops.push(db.highlight.update({ where: { id: row.id }, data: { orphaned: true } }));
    }
  }

  if (ops.length > 0) {
    await db.$transaction(ops);
  }
}

async function getHighlightNoteRef(highlightId: string) {
  return db.highlight.findUniqueOrThrow({
    where: { id: highlightId },
    select: { note: { select: { projectId: true, id: true } } },
  });
}

export async function addHighlightTag(highlightId: string, tagId: string) {
  const highlight = await getHighlightNoteRef(highlightId);
  await db.highlightTag.upsert({
    where: { highlightId_tagId: { highlightId, tagId } },
    create: { highlightId, tagId },
    update: {},
  });
  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}

export async function removeHighlightTag(highlightId: string, tagId: string) {
  const highlight = await getHighlightNoteRef(highlightId);
  await db.highlightTag.delete({
    where: { highlightId_tagId: { highlightId, tagId } },
  });
  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}
