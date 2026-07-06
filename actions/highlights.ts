"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { stripHighlightMark } from "@/lib/editor/extractIds";
import { docToPlainText } from "@/lib/editor/plainText";
import { syncHighlightEmbeddings } from "@/lib/embeddings/sync";
import { deleteEmbeddingsForHighlight } from "@/lib/embeddings/cleanup";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";
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
  const user = await requireUser();
  const note = await db.note.findUniqueOrThrow({
    where: { id: noteId },
    select: { projectId: true },
  });
  await requireProjectEditAccess(note.projectId, user.id);

  const order = await db.highlight.count({ where: { noteId } });

  const highlight = await db.highlight.upsert({
    where: { noteId_markId: { noteId, markId } },
    create: { noteId, markId, quote, order, ...clipRange },
    update: { quote, orphaned: false, ...clipRange },
  });

  void syncHighlightEmbeddings([highlight.id]);
  await revalidateHighlightPaths(note.projectId, noteId);
  return highlight;
}

export async function createWholeNoteHighlight(noteId: string) {
  const user = await requireUser();
  const note = await db.note.findUniqueOrThrow({ where: { id: noteId } });
  await requireProjectEditAccess(note.projectId, user.id);

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

  void syncHighlightEmbeddings([highlight.id]);
  await revalidateHighlightPaths(note.projectId, noteId);
  return highlight;
}

export async function deleteHighlight(highlightId: string) {
  const user = await requireUser();
  const highlight = await db.highlight.findUniqueOrThrow({
    where: { id: highlightId },
    include: { note: { select: { id: true, projectId: true, content: true } } },
  });
  await requireProjectEditAccess(highlight.note.projectId, user.id);

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
  await deleteEmbeddingsForHighlight(highlightId);
  // InsightConflict.conflictingId is polymorphic (no FK, same limitation as
  // EmbeddingChunk.subjectId) -- only the owning Insight side cascades via
  // FK, so a highlight referenced as the *conflicting* evidence needs
  // explicit cleanup here or its conflict row dangles forever.
  await db.insightConflict.deleteMany({
    where: { conflictingType: "HIGHLIGHT", conflictingId: highlightId },
  });

  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}

async function getHighlightNoteRef(highlightId: string) {
  return db.highlight.findUniqueOrThrow({
    where: { id: highlightId },
    select: { note: { select: { projectId: true, id: true } } },
  });
}

export async function addHighlightTag(highlightId: string, tagId: string) {
  const user = await requireUser();
  const highlight = await getHighlightNoteRef(highlightId);
  await requireProjectEditAccess(highlight.note.projectId, user.id);

  await db.highlightTag.upsert({
    where: { highlightId_tagId: { highlightId, tagId } },
    create: { highlightId, tagId },
    update: {},
  });
  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}

export async function removeHighlightTag(highlightId: string, tagId: string) {
  const user = await requireUser();
  const highlight = await getHighlightNoteRef(highlightId);
  await requireProjectEditAccess(highlight.note.projectId, user.id);

  await db.highlightTag.delete({
    where: { highlightId_tagId: { highlightId, tagId } },
  });
  await revalidateHighlightPaths(highlight.note.projectId, highlight.note.id);
}
